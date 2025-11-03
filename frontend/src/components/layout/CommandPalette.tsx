import { Command } from "cmdk";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NAV_ITEMS } from "../../data/navigation";
import { useRecentSymbols } from "../../hooks/useRecentSymbols";

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (value: boolean) => void;
};

export const CommandPalette = ({ open, onOpenChange }: CommandPaletteProps) => {
  const navigate = useNavigate();
  const { symbols } = useRecentSymbols();

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  const handleAction = (value: string) => {
    onOpenChange(false);
    navigate(value);
  };

  return (
    <Command.Dialog open={open} onOpenChange={onOpenChange} label="Quick search" className="cmdk-dialog">
      <Command.Input placeholder="Jump to a page or symbol..." />
      <Command.List>
        <Command.Empty>No results.</Command.Empty>
        <Command.Group heading="Navigate">
          {NAV_ITEMS.map((item) => (
            <Command.Item key={item.path} value={item.path} onSelect={handleAction}>
              {item.label}
              <span className="ml-auto text-xs text-slate-500">{item.description}</span>
            </Command.Item>
          ))}
        </Command.Group>
        {symbols.length > 0 && (
          <Command.Group heading="Recent symbols">
            {symbols.map((item) => (
              <Command.Item key={item.symbol} value={`/?symbol=${item.symbol}`} onSelect={handleAction}>
                {item.symbol}
                <span className="ml-auto text-xs text-slate-500">{item.name}</span>
              </Command.Item>
            ))}
          </Command.Group>
        )}
      </Command.List>
    </Command.Dialog>
  );
};
