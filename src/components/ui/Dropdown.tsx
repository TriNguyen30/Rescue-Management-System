import { useState } from "react";
import { ChevronDown } from "lucide-react";

export type DropdownItem = {
  label: string;
  value: string;
  onClick?: () => void;
};

type DropdownMenuProps = {
  label: string;
  items: DropdownItem[];
};

export default function DropdownMenu({ label, items }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button className="flex items-center gap-1 text-gray-600 hover:text-green-500 font-medium">
        {label}
        <ChevronDown className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute top-full left-0 pt-2 w-56 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
            {items.map((item) => (
              <div
                key={item.value}
                onClick={() => {
                  item.onClick?.();
                  setOpen(false);
                }}
                className="px-4 py-2 text-gray-700 cursor-pointer hover:text-green-500 transition-colors duration-200"
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
