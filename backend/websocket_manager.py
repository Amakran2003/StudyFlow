import logging
import asyncio
import json
import datetime
from typing import Dict, Optional
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger("websocket_manager")

class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.audio_duration: Optional[float] = None
        self.shutdown_event = asyncio.Event()

    async def connect(self, websocket: WebSocket, client_id: str) -> None:
        """Accept a new WebSocket connection and store it"""
        await websocket.accept()
        logger.info(f"WebSocket connection established for client {client_id}")
        
        # If there's an existing connection for this client, close it
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].close()
                logger.info(f"Closed existing connection for client {client_id}")
            except:
                pass
        
        # Store the new connection
        self.active_connections[client_id] = websocket

    async def disconnect(self, client_id: str) -> None:
        """Remove a client connection"""
        self.active_connections.pop(client_id, None)
        logger.info(f"Cleaned up connection for client {client_id}")

    async def send_initial_message(self, client_id: str) -> None:
        """Send initial connection message with audio duration"""
        if client_id not in self.active_connections:
            return

        websocket = self.active_connections[client_id]
        try:
            await websocket.send_json({
                "type": "connected",
                "message": "WebSocket connection established",
                "audioInfo": {"duration": self.audio_duration}
            })
            await websocket.send_json({
                "type": "progress",
                "value": 0,
                "duration": self.audio_duration,
                "timestamp": datetime.datetime.now().isoformat()
            })
        except Exception as e:
            logger.error(f"Error sending initial message to {client_id}: {str(e)}")
            await self.disconnect(client_id)

    async def send_progress(self, client_id: str, progress: int) -> None:
        """Send progress updates to a specific client"""
        if client_id not in self.active_connections:
            logger.warning(f"No active connection found for client {client_id}")
            return
            
        try:
            websocket = self.active_connections[client_id]
            normalized_progress = max(0, min(100, int(progress)))
            
            message = {
                "type": "progress",
                "value": normalized_progress,
                "duration": self.audio_duration,
                "timestamp": datetime.datetime.now().isoformat()
            }
            
            logger.debug(f"Progress update: {normalized_progress}%")
            await websocket.send_text(json.dumps(message))
            
            logger.info(f"Successfully sent progress {normalized_progress}% to client {client_id}")
        except WebSocketDisconnect:
            logger.warning(f"WebSocket disconnected for client {client_id} while sending progress")
            await self.disconnect(client_id)
        except Exception as e:
            logger.error(f"Error sending progress to client {client_id}: {str(e)}")
            await self.disconnect(client_id)

    async def handle_connection(self, client_id: str) -> None:
        """Handle an active WebSocket connection"""
        if client_id not in self.active_connections:
            return

        websocket = self.active_connections[client_id]
        last_activity = asyncio.get_event_loop().time()
        
        try:
            while not self.shutdown_event.is_set():
                current_time = asyncio.get_event_loop().time()
                try:
                    data = await asyncio.wait_for(
                        websocket.receive_json(),
                        timeout=35.0  # Slightly longer than ping interval
                    )
                    if data.get('type') == 'ping':
                        if current_time - last_activity >= 25.0:
                            await websocket.send_json({"type": "pong"})
                            logger.debug(f"Received ping from {client_id}, connection alive")
                        last_activity = current_time
                except asyncio.TimeoutError:
                    if current_time - last_activity >= 60.0:  # No activity for 60 seconds
                        logger.warning(f"Connection timeout for client {client_id}")
                        break
                    continue
        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected for client {client_id}")
        except Exception as e:
            logger.error(f"WebSocket error for client {client_id}: {str(e)}")
        finally:
            await self.disconnect(client_id)

    def set_audio_duration(self, duration: float) -> None:
        """Set the audio duration"""
        self.audio_duration = duration

    def clear_audio_duration(self) -> None:
        """Clear the audio duration"""
        self.audio_duration = None
