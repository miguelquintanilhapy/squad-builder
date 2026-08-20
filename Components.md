You are given a task to integrate an existing React component in the codebase

The codebase should support:
- shadcn project structure  
- Tailwind CSS
- Typescript

If it doesn't, provide instructions on how to setup project via shadcn CLI, install Tailwind or Typescript.

Determine the default path for components and styles. 
If default path for components is not /components/ui, provide instructions on why it's important to create this folder
Copy-paste this component to /components/ui folder:
```tsx
command-menu.tsx
"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { motion } from "motion/react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";
import { ScrollArea } from "@/components/ui/scroll-area";

// Utility function to detect OS and return appropriate modifier key
const getModifierKey = () => {
  if (typeof navigator === "undefined") return { key: "Ctrl", symbol: "Ctrl" };

  const isMac =
    navigator.platform.toUpperCase().indexOf("MAC") >= 0 ||
    navigator.userAgent.toUpperCase().indexOf("MAC") >= 0;

  return isMac ? { key: "cmd", symbol: "⌘" } : { key: "ctrl", symbol: "Ctrl" };
};

// Context for sharing state between components
interface CommandMenuContextType {
  value: string;
  setValue: (value: string) => void;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  scrollType?: "auto" | "always" | "scroll" | "hover";
  scrollHideDelay?: number;
}

const CommandMenuContext = React.createContext<
  CommandMenuContextType | undefined
>(undefined);

const CommandMenuProvider: React.FC<{
  children: React.ReactNode;
  value: string;
  setValue: (value: string) => void;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  scrollType?: "auto" | "always" | "scroll" | "hover";
  scrollHideDelay?: number;
}> = ({
  children,
  value,
  setValue,
  selectedIndex,
  setSelectedIndex,
  scrollType,
  scrollHideDelay,
}) => (
  <CommandMenuContext.Provider
    value={{
      value,
      setValue,
      selectedIndex,
      setSelectedIndex,
      scrollType,
      scrollHideDelay,
    }}
  >
    {children}
  </CommandMenuContext.Provider>
);

const useCommandMenu = () => {
  const context = React.useContext(CommandMenuContext);
  if (!context) {
    throw new Error("useCommandMenu must be used within CommandMenuProvider");
  }
  return context;
};

// Core CommandMenu component using Dialog
const CommandMenu = DialogPrimitive.Root;
const CommandMenuTrigger = DialogPrimitive.Trigger;
const CommandMenuPortal = DialogPrimitive.Portal;
const CommandMenuClose = DialogPrimitive.Close;

// Title components for accessibility
const CommandMenuTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight text-foreground",
      className
    )}
    {...props}
  />
));
CommandMenuTitle.displayName = "CommandMenuTitle";

const CommandMenuDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CommandMenuDescription.displayName = "CommandMenuDescription";

// Overlay with backdrop blur
const CommandMenuOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
CommandMenuOverlay.displayName = "CommandMenuOverlay";

// Main content container with keyboard navigation
const CommandMenuContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    showShortcut?: boolean;
    scrollType?: "auto" | "always" | "scroll" | "hover";
    scrollHideDelay?: number;
  }
>(
  (
    {
      className,
      children,
      showShortcut = true,
      scrollType = "hover",
      scrollHideDelay = 600,
      ...props
    },
    ref
  ) => {
    const [value, setValue] = React.useState("");
    const [selectedIndex, setSelectedIndex] = React.useState(0);

    // Keyboard navigation
    React.useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          // Logic will be handled by CommandMenuList
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          // Logic will be handled by CommandMenuList
        } else if (e.key === "Enter") {
          e.preventDefault();
          // Logic will be handled by CommandMenuItem
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
      <CommandMenuPortal>
        <CommandMenuOverlay />
        <DialogPrimitive.Content asChild ref={ref} {...props}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "fixed left-[50%] top-[30%] z-50 w-[95%] max-w-2xl translate-x-[-50%] translate-y-[-50%]",
              "bg-background border border-border rounded-card shadow-lg",
              "overflow-hidden",
              className
            )}
          >
            {" "}
            <CommandMenuProvider
              value={value}
              setValue={setValue}
              selectedIndex={selectedIndex}
              setSelectedIndex={setSelectedIndex}
              scrollType={scrollType}
              scrollHideDelay={scrollHideDelay}
            >
              <VisuallyHidden.Root>
                <CommandMenuTitle>Command Menu</CommandMenuTitle>
              </VisuallyHidden.Root>

              {children}

              <CommandMenuClose className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors">
                <X size={14} />
                <span className="sr-only">Close</span>
              </CommandMenuClose>

              {showShortcut && (
                <div className="absolute right-12 top-3 flex items-center justify-center gap-1 h-6.5">
                  <Kbd size="xs">{getModifierKey().symbol}</Kbd>
                  <Kbd size="xs">K</Kbd>
                </div>
              )}
            </CommandMenuProvider>
          </motion.div>
        </DialogPrimitive.Content>
      </CommandMenuPortal>
    );
  }
);
CommandMenuContent.displayName = "CommandMenuContent";

// Input component for search
const CommandMenuInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    placeholder?: string;
  }
>(
  (
    { className, placeholder = "Type a command or search...", ...props },
    ref
  ) => {
    const { value, setValue } = useCommandMenu();

    return (
      <div className="flex items-center border-b border-border px-3 py-0">
        <Search className="mr-3 h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={cn(
            "flex h-12 w-full rounded-none border-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          placeholder={placeholder}
          {...props}
        />
      </div>
    );
  }
);
CommandMenuInput.displayName = "CommandMenuInput";

// List container for command items with scroll area
const CommandMenuList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    maxHeight?: string;
  }
>(({ className, children, maxHeight = "300px", ...props }, ref) => {
  const {
    selectedIndex,
    setSelectedIndex,
    scrollType = "hover",
    scrollHideDelay = 600,
  } = useCommandMenu();

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const items = document.querySelectorAll("[data-command-item]");
      const maxIndex = items.length - 1;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const newIndex = Math.min(selectedIndex + 1, maxIndex);
        setSelectedIndex(newIndex);

        // Scroll selected item into view
        const selectedItem = items[newIndex] as HTMLElement;
        if (selectedItem) {
          selectedItem.scrollIntoView({
            block: "nearest",
            behavior: "smooth",
          });
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const newIndex = Math.max(selectedIndex - 1, 0);
        setSelectedIndex(newIndex);

        // Scroll selected item into view
        const selectedItem = items[newIndex] as HTMLElement;
        if (selectedItem) {
          selectedItem.scrollIntoView({
            block: "nearest",
            behavior: "smooth",
          });
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, setSelectedIndex]);

  return (
    <div ref={ref} className="p-1" {...props}>
      <ScrollArea
        className={cn("w-full", className)}
        style={{ height: maxHeight }}
        type={scrollType}
        scrollHideDelay={scrollHideDelay}
      >
        <div className="space-y-1 p-1">{children}</div>
      </ScrollArea>
    </div>
  );
});
CommandMenuList.displayName = "CommandMenuList";

// Command group with optional heading
const CommandMenuGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    heading?: string;
  }
>(({ className, children, heading, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props}>
    {heading && (
      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {heading}
      </div>
    )}
    {children}
  </div>
));
CommandMenuGroup.displayName = "CommandMenuGroup";

// Individual command item
const CommandMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    onSelect?: () => void;
    disabled?: boolean;
    shortcut?: string;
    icon?: React.ReactNode;
    index?: number;
  }
>(
  (
    {
      className,
      children,
      onSelect,
      disabled = false,
      shortcut,
      icon,
      index = 0,
      ...props
    },
    ref
  ) => {
    const { selectedIndex, setSelectedIndex } = useCommandMenu();
    const isSelected = selectedIndex === index;

    // Handle click and enter key
    const handleSelect = React.useCallback(() => {
      if (!disabled && onSelect) {
        onSelect();
      }
    }, [disabled, onSelect]);

    React.useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter" && isSelected) {
          e.preventDefault();
          handleSelect();
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isSelected, handleSelect]);

    return (
      <div
        ref={ref}
        data-command-item
        className={cn(
          "relative flex cursor-default select-none items-center rounded-ele px-2 py-2 text-sm outline-none transition-colors gap-2",
          "hover:bg-accent hover:text-accent-foreground",
          isSelected &&
            "bg-accent text-accent-foreground",
          disabled && "pointer-events-none opacity-50",
          className
        )}
        onClick={handleSelect}
        onMouseEnter={() => setSelectedIndex(index)}
        {...props}
      >
        {icon && (
          <div className="h-4 w-4 flex items-center justify-center">{icon}</div>
        )}

        <div className="flex-1">{children}</div>

        {shortcut && (
          <div className="ml-auto flex items-center gap-1">
            {shortcut.split("+").map((key, i) => (
              <React.Fragment key={key}>
                {i > 0 && (
                  <span className="text-muted-foreground text-xs">
                    +
                  </span>
                )}
                <Kbd size="xs">
                  {key === "cmd" || key === "⌘"
                    ? getModifierKey().symbol
                    : key === "shift"
                    ? "⇧"
                    : key === "alt"
                    ? "⌥"
                    : key === "ctrl"
                    ? getModifierKey().key === "cmd"
                      ? "⌃"
                      : "Ctrl"
                    : key}
                </Kbd>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    );
  }
);
CommandMenuItem.displayName = "CommandMenuItem";

// Separator between groups
const CommandMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    {...props}
  />
));
CommandMenuSeparator.displayName = "CommandMenuSeparator";

// Empty state
const CommandMenuEmpty = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children = "No results found.", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "py-6 text-center text-sm text-muted-foreground",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
CommandMenuEmpty.displayName = "CommandMenuEmpty";

// Hook for global keyboard shortcut
export const useCommandMenuShortcut = (callback: () => void) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        callback();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [callback]);
};

export {
  CommandMenu,
  CommandMenuTrigger,
  CommandMenuContent,
  CommandMenuTitle,
  CommandMenuDescription,
  CommandMenuInput,
  CommandMenuList,
  CommandMenuEmpty,
  CommandMenuGroup,
  CommandMenuItem,
  CommandMenuSeparator,
  CommandMenuClose,
  useCommandMenu,
};

demo.tsx
import * as React from "react";
import {
  CommandMenu,
  CommandMenuTrigger,
  CommandMenuContent,
  CommandMenuInput,
  CommandMenuList,
  CommandMenuGroup,
  CommandMenuItem,
  CommandMenuSeparator,
  useCommandMenuShortcut,
} from "@/components/ui/command-menu";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { 
  Command, 
  Calendar, 
  User, 
  Settings, 
  Plus, 
  Upload, 
  Download 
} from "lucide-react";

// Utility function to detect OS and return appropriate modifier key
const getModifierKey = () => {
  if (typeof navigator === "undefined") return { key: "Ctrl", symbol: "Ctrl" };
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0 ||
               navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
  return isMac
    ? { key: "cmd", symbol: "⌘" }
    : { key: "ctrl", symbol: "Ctrl" };
};

export default function DemoOne() {
  const [open, setOpen] = React.useState(false);
  useCommandMenuShortcut(() => setOpen(true));
  return (
    <CommandMenu open={open} onOpenChange={setOpen}>
      <CommandMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Command size={16} />
          Open Command Menu
          <div className="ml-auto flex items-center gap-1">
            <Kbd size="xs">{getModifierKey().symbol}</Kbd>
            <Kbd size="xs">K</Kbd>
          </div>
        </Button>
      </CommandMenuTrigger>
      <CommandMenuContent>
        <CommandMenuInput placeholder="Type a command or search..." />
        <CommandMenuList>
          <CommandMenuGroup heading="Suggestions">
            <CommandMenuItem icon={<Calendar />} index={0}>
              Calendar
            </CommandMenuItem>
            <CommandMenuItem icon={<User />} index={1}>
              Search Users
            </CommandMenuItem>
            <CommandMenuItem icon={<Settings />} index={2}>
              Settings
            </CommandMenuItem>
          </CommandMenuGroup>
          <CommandMenuSeparator />
          <CommandMenuGroup heading="Actions">
            <CommandMenuItem icon={<Plus />} index={3} shortcut="cmd+n">
              Create New
            </CommandMenuItem>
            <CommandMenuItem icon={<Upload />} index={4} shortcut="cmd+u">
              Upload File
            </CommandMenuItem>
            <CommandMenuItem icon={<Download />} index={5} shortcut="cmd+d">
              Download
            </CommandMenuItem>
          </CommandMenuGroup>
        </CommandMenuList>
      </CommandMenuContent>
    </CommandMenu>
  );
};
```

Copy-paste these files for dependencies:
```tsx
preetsuthar17/kbd
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const kbdVariants = cva(
  "inline-flex items-center justify-center font-mono font-medium text-xs bg-muted text-muted-foreground border border-border rounded-md border-b-3 transition-all duration-75 cursor-pointer select-none active:translate-y-[1px] active:border-b-[1px]  hover:bg-muted/80 shadow-sm/2",
  {
    variants: {
      variant: {
        default:
          "bg-muted text-muted-foreground border-border",
        outline:
          "bg-transparent border-border text-foreground hover:bg-accent",
        solid:
          "bg-foreground text-background border-foreground hover:bg-foreground/90",
        secondary:
          "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80",
      },
      size: {
        xs: "h-5 px-1.5 text-[10px] min-w-[1.25rem]",
        sm: "h-6 px-2 text-xs min-w-[1.5rem]",
        md: "h-7 px-2.5 text-sm min-w-[1.75rem]",
        lg: "h-8 px-3 text-sm min-w-[2rem]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "sm",
    },
  },
);

export interface KbdProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof kbdVariants> {
  keys?: string[];
  onClick?: () => void;
}

const Kbd = React.forwardRef<HTMLElement, KbdProps>(
  ({ className, variant, size, keys, children, onClick, ...props }, ref) => {
    // If keys array is provided, render multiple kbd elements
    if (keys && keys.length > 0) {
      return (
        <span
          className="inline-flex items-center gap-1"
          ref={ref as React.Ref<HTMLSpanElement>}
          onClick={onClick}
        >
          {keys.map((key, index) => (
            <React.Fragment key={index}>
              <kbd
                className={cn(kbdVariants({ variant, size }), className)}
                {...props}
              >
                {key}
              </kbd>
              {index < keys.length - 1 && (
                <span className="text-muted-foreground text-xs px-1">
                  +
                </span>
              )}
            </React.Fragment>
          ))}
        </span>
      );
    }

    // Single kbd element
    return (
      <kbd
        className={cn(kbdVariants({ variant, size }), className)}
        ref={ref}
        onClick={onClick}
        {...props}
      >
        {children}
      </kbd>
    );
  },
);

Kbd.displayName = "Kbd";

export { Kbd, kbdVariants };
```
```tsx
preetsuthar17/scroll-area
"use client";

import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const scrollAreaVariants = cva("relative overflow-hidden", {
  variants: {
    orientation: {
      vertical: "h-full",
      horizontal: "w-full",
      both: "h-full w-full",
    },
  },
  defaultVariants: {
    orientation: "vertical",
  },
});

const scrollBarVariants = cva("flex touch-none select-none transition-colors", {
  variants: {
    orientation: {
      vertical: "h-full w-2.5 border-l border-l-transparent p-[1px]",
      horizontal: "h-2.5 w-full border-t border-t-transparent p-[1px]",
    },
  },
  defaultVariants: {
    orientation: "vertical",
  },
});

export interface ScrollAreaProps
  extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>,
    VariantProps<typeof scrollAreaVariants> {
  scrollHideDelay?: number;
  type?: "auto" | "always" | "scroll" | "hover";
}

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  ScrollAreaProps
>(
  (
    {
      className,
      children,
      orientation,
      scrollHideDelay = 600,
      type = "hover",
      ...props
    },
    ref
  ) => (
    <ScrollAreaPrimitive.Root
      ref={ref}
      className={cn(scrollAreaVariants({ orientation }), className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar
        orientation="vertical"
        type={type}
        scrollHideDelay={scrollHideDelay}
      />
      {(orientation === "horizontal" || orientation === "both") && (
        <ScrollBar
          orientation="horizontal"
          type={type}
          scrollHideDelay={scrollHideDelay}
        />
      )}
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
);

ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

interface ScrollBarProps
  extends React.ComponentPropsWithoutRef<
    typeof ScrollAreaPrimitive.ScrollAreaScrollbar
  > {
  scrollHideDelay?: number;
  type?: "auto" | "always" | "scroll" | "hover";
}

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  ScrollBarProps
>(
  (
    { className, orientation = "vertical", scrollHideDelay, type, ...props },
    ref
  ) => {
    return (
      <ScrollAreaPrimitive.ScrollAreaScrollbar
        ref={ref}
        orientation={orientation}
        className={cn(
          scrollBarVariants({ orientation }),
          "hover:bg-accent",
          className
        )}
        {...(scrollHideDelay && { scrollHideDelay })}
        {...(type && { type })}
        {...props}
      >
        <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border hover:bg-foreground/30 transition-colors" />
      </ScrollAreaPrimitive.ScrollAreaScrollbar>
    );
  }
);

ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar, scrollAreaVariants };
```
```tsx
preetsuthar17/button
"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-ele text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring shadow-sm/2",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive shadow-sm/2",
        outline:
          "border border-border text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring shadow-sm/2",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-ring",
        ghost:
          "text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring",
        link: "text-secondary-foreground underline-offset-4 hover:underline focus-visible:ring-ring",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-8",
        xl: "h-12 px-10 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type CustomButtonProps = Omit<
  ButtonProps,
  keyof React.ComponentProps<"button">
>;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    const content = (
      <>
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {leftIcon && !loading && leftIcon}
        {children}
        {rightIcon && !loading && rightIcon}
      </>
    );

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {asChild ? children : content}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
```

Install NPM dependencies:
```bash
motion, lucide-react, @radix-ui/react-dialog, @radix-ui/react-visually-hidden, class-variance-authority, @radix-ui/react-scroll-area, @radix-ui/react-slot
```

Extend existing Tailwind 4 index.css with this code (or if project uses Tailwind 3, extend tailwind.config.js or globals.css):
```css
@import "tailwindcss";
@import "tw-animate-css";

:root {
  --hu-font-geist: var(--font-geist);
  --hu-font-jetbrains: var(--font-jetbrains-mono);
  --radius: 0.8rem;
  --card-radius: 1rem;
  --hu-background: 0, 0%, 100%;
  --hu-foreground: 0, 0%, 14%;
  --hu-card: 0, 0%, 99%;
  --hu-card-foreground: 0, 0%, 14%;
  --hu-primary: 235, 100%, 60%;
  --hu-primary-foreground: 0, 0%, 98%;
  --hu-secondary: 0, 0%, 97%;
  --hu-secondary-foreground: 0, 0%, 20%;
  --hu-muted: 0, 0%, 97%;
  --hu-muted-foreground: 0, 0%, 56%;
  --hu-accent: 0, 0%, 96%;
  --hu-accent-foreground: 0, 0%, 20%;
  --hu-destructive: 9, 96%, 47%;
  --hu-destructive-foreground: 0, 0%, 98%;
  --hu-border: 0, 0%, 92%;
  --hu-input: 0, 0%, 100%;
  --hu-ring: 0, 0%, 71%;
  --color-fd-background: hsl(var(--hu-background));
  --color-fd-card: hsl(var(--hu-background));
}

.dark {
  --hu-background: 0, 0%, 7%;
  --hu-foreground: 0, 0%, 100%;
  --hu-card: 0, 0%, 9%;
  --hu-card-foreground: 0, 0%, 100%;
  --hu-primary: 235, 100%, 60%;
  --hu-primary-foreground: 0, 0%, 98%;
  --hu-secondary: 0, 0%, 15%;
  --hu-secondary-foreground: 0, 0%, 100%;
  --hu-muted: 0, 0%, 15%;
  --hu-muted-foreground: 0, 0%, 71%;
  --hu-accent: 0, 0%, 15%;
  --hu-accent-foreground: 0, 0%, 100%;
  --hu-destructive: 0, 84%, 50%;
  --hu-destructive-foreground: 0, 0%, 98%;
  --hu-border: 0, 0%, 100%, 10%;
  --hu-input: 0, 0%, 100%, 5%;
  --hu-ring: 0, 0%, 56%;
  --color-fd-background: hsl(var(--hu-background));
  --color-fd-card: hsl(var(--hu-background));
}

```
