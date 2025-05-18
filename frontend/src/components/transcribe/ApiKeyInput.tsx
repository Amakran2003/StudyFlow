import { motion } from 'framer-motion';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface ApiKeyInputProps {
  apiKey: string;
  onApiKeyChange: (value: string) => void;
}

export function ApiKeyInput({ apiKey, onApiKeyChange }: ApiKeyInputProps) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-2"
    >
      <div className="flex flex-col space-y-1.5">
        <Label htmlFor="api-key">OpenAI API Key</Label>
        <Input
          id="api-key"
          type="password"
          value={apiKey}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onApiKeyChange(e.target.value)}
          placeholder="sk-..."
        />
        <p className="text-xs text-muted-foreground">
          Your API key is only used for summarization and never stored
        </p>
      </div>
    </motion.div>
  );
}
