# React Components Integration Roadmap for `www.solen.ch`

> **For:** Claude Code
> **Task:** Integrate modern React components (`ExpandableTabs`, `ActionSearchBar`, `SlidingNumber`) into the Solen codebase.
> **Architecture Reality:** Solen is a **Vite + vanilla JS monolith** (`index.html` at ~972KB, `src/main.js`). There is **no React, no TypeScript, no Tailwind yet.** Phase 1 converts this from scratch.
> **Goal:** Complete this phased roadmap step-by-step. Do not lose any details. Ensure one phase is completely finished and integrated before moving to the next.

---

## Phase 1: Environment Setup & Modernization

> ⚠️ **CONFIRMED:** Solen is a Vite + vanilla JS monolith. `index.html` is ~972KB. `src/main.js` exists. There is **no React, no TypeScript, no Tailwind**. You are setting this up from scratch alongside the existing code.

The codebase MUST support:
- **React + TypeScript** (via Vite)
- **Tailwind CSS**
- **shadcn/ui** project structure

**Action Items:**
1. **Modernize with Vite React/TS:** The project already uses Vite. Add React + TypeScript support by installing `react`, `react-dom`, `@types/react`, `@types/react-dom`, and `typescript`. Update `vite.config.js` accordingly. Create a `src/react-entry.tsx` as the React entry point — do NOT delete or replace `src/main.js` or `index.html`, as those power the existing vanilla JS app.
2. **Tailwind CSS Init:** `npm install -D tailwindcss postcss autoprefixer` → `npx tailwindcss init -p`. Update `tailwind.config.js` to scan `./src/**/*.{ts,tsx}`.
3. **shadcn CLI Setup:** Run `npx shadcn@latest init`. Set the components path to `src/components/ui`.
4. **Components Folder:** Create `src/components/ui/`. This is critical — all three components and all shadcn primitives import from `@/components/ui/`. Configure the `@` alias in `vite.config.ts` to point to `./src`.

---

## Phase 2: Core Dependencies Installation
Install the necessary NPM packages required by the 3 components:
```bash
npm install framer-motion lucide-react usehooks-ts react-use-measure clsx tailwind-merge
```
*(Ensure `@/lib/utils` is configured properly by shadcn init to provide the `cn` function).*

---

## Phase 3: Integrate ExpandableTabs

**1. Create the component file:**
Path: `components/ui/expandable-tabs.tsx` (or `src/components/ui/expandable-tabs.tsx` depending on project root)
Code:
```tsx
"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOnClickOutside } from "usehooks-ts";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface Tab {
  title: string;
  icon: LucideIcon;
  type?: never;
}

interface Separator {
  type: "separator";
  title?: never;
  icon?: never;
}

type TabItem = Tab | Separator;

interface ExpandableTabsProps {
  tabs: TabItem[];
  className?: string;
  activeColor?: string;
  onChange?: (index: number | null) => void;
}

const buttonVariants = {
  initial: {
    gap: 0,
    paddingLeft: ".5rem",
    paddingRight: ".5rem",
  },
  animate: (isSelected: boolean) => ({
    gap: isSelected ? ".5rem" : 0,
    paddingLeft: isSelected ? "1rem" : ".5rem",
    paddingRight: isSelected ? "1rem" : ".5rem",
  }),
};

const spanVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: "auto", opacity: 1 },
  exit: { width: 0, opacity: 0 },
};

const transition = { delay: 0.1, type: "spring", bounce: 0, duration: 0.6 };

export function ExpandableTabs({
  tabs,
  className,
  activeColor = "text-primary",
  onChange,
}: ExpandableTabsProps) {
  const [selected, setSelected] = React.useState<number | null>(null);
  const outsideClickRef = React.useRef(null);

  useOnClickOutside(outsideClickRef, () => {
    setSelected(null);
    onChange?.(null);
  });

  const handleSelect = (index: number) => {
    setSelected(index);
    onChange?.(index);
  };

  const Separator = () => (
    <div className="mx-1 h-[24px] w-[1.2px] bg-border" aria-hidden="true" />
  );

  return (
    <div
      ref={outsideClickRef}
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-2xl border bg-background p-1 shadow-sm",
        className
      )}
    >
      {tabs.map((tab, index) => {
        if (tab.type === "separator") {
          return <Separator key={`separator-${index}`} />;
        }

        const Icon = tab.icon;
        return (
           <motion.button
            key={tab.title}
            variants={buttonVariants}
            initial={false}
            animate="animate"
            custom={selected === index}
            onClick={() => handleSelect(index)}
            transition={transition}
            className={cn(
              "relative flex items-center rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-300",
              selected === index
                ? cn("bg-muted", activeColor)
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon size={20} />
            <AnimatePresence initial={false}>
              {selected === index && (
                <motion.span
                  variants={spanVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={transition}
                  className="overflow-hidden"
                >
                  {tab.title}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}
```

**2. Implement Demo/Integration:**
Create a wrapper or inject this into the application (e.g., `src/App.tsx` or mounted onto `index.html`):
```tsx
import { Bell, Home, HelpCircle, Settings, Shield, Mail, User, FileText, Lock } from "lucide-react";
import { ExpandableTabs } from "@/components/ui/expandable-tabs";

export function DefaultDemo() {
  const tabs = [
    { title: "Dashboard", icon: Home },
    { title: "Notifications", icon: Bell },
    { type: "separator" },
    { title: "Settings", icon: Settings },
    { title: "Support", icon: HelpCircle },
    { title: "Security", icon: Shield },
  ];

  return (
    <div className="flex flex-col gap-4">
      <ExpandableTabs tabs={tabs} />
    </div>
  );
}

export function CustomColorDemo() {
  const tabs = [
    { title: "Profile", icon: User },
    { title: "Messages", icon: Mail },
    { type: "separator" },
    { title: "Documents", icon: FileText },
    { title: "Privacy", icon: Lock },
  ];

  return (
    <div className="flex flex-col gap-4">
      <ExpandableTabs 
        tabs={tabs} 
        activeColor="text-blue-500"
        className="border-blue-200 dark:border-blue-800" 
      />
    </div>
  );
}
```


---

## Phase 4: Integrate ActionSearchBar

**1. Create the Input Component:**
Path: `components/ui/input.tsx`
Code:
```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"
export { Input }
```

**2. Create the Search Component:**
Path: `components/ui/action-search-bar.tsx`
Code:
```tsx
"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Send, BarChart2, Globe, Video, PlaneTakeoff, AudioLines } from "lucide-react";

function useDebounce<T>(value: T, delay: number = 500): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}

export interface Action {
    id: string;
    label: string;
    icon: React.ReactNode;
    description?: string;
    short?: string;
    end?: string;
}

interface SearchResult {
    actions: Action[];
}

const allActions = [
    { id: "1", label: "Book tickets", icon: <PlaneTakeoff className="h-4 w-4 text-blue-500" />, description: "Operator", short: "⌘K", end: "Agent" },
    { id: "2", label: "Summarize", icon: <BarChart2 className="h-4 w-4 text-orange-500" />, description: "gpt-4o", short: "⌘cmd+p", end: "Command" },
    { id: "3", label: "Screen Studio", icon: <Video className="h-4 w-4 text-purple-500" />, description: "gpt-4o", short: "", end: "Application" },
    { id: "4", label: "Talk to Jarvis", icon: <AudioLines className="h-4 w-4 text-green-500" />, description: "gpt-4o voice", short: "", end: "Active" },
    { id: "5", label: "Translate", icon: <Globe className="h-4 w-4 text-blue-500" />, description: "gpt-4o", short: "", end: "Command" },
];

function ActionSearchBar({ actions = allActions }: { actions?: Action[] }) {
    const [query, setQuery] = useState("");
    const [result, setResult] = useState<SearchResult | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [selectedAction, setSelectedAction] = useState<Action | null>(null);
    const debouncedQuery = useDebounce(query, 200);

    useEffect(() => {
        if (!isFocused) {
            setResult(null);
            return;
        }
        if (!debouncedQuery) {
            setResult({ actions: allActions });
            return;
        }
        const normalizedQuery = debouncedQuery.toLowerCase().trim();
        const filteredActions = allActions.filter((action) => action.label.toLowerCase().includes(normalizedQuery));
        setResult({ actions: filteredActions });
    }, [debouncedQuery, isFocused]);

    const handleFocus = () => {
        setSelectedAction(null);
        setIsFocused(true);
    };

    const container = { hidden: { opacity: 0, height: 0 }, show: { opacity: 1, height: "auto", transition: { height: { duration: 0.4 }, staggerChildren: 0.1 } }, exit: { opacity: 0, height: 0, transition: { height: { duration: 0.3 }, opacity: { duration: 0.2 } } } };
    const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } }, exit: { opacity: 0, y: -10, transition: { duration: 0.2 } } };

    return (
        <div className="w-full max-w-xl mx-auto">
            <div className="relative flex flex-col justify-start items-center min-h-[300px]">
                <div className="w-full max-w-sm sticky top-0 bg-background z-10 pt-4 pb-1">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Search Commands</label>
                    <div className="relative">
                        <Input type="text" placeholder="What's up?" value={query} onChange={(e) => { setQuery(e.target.value); setIsTyping(true); }} onFocus={handleFocus} onBlur={() => setTimeout(() => setIsFocused(false), 200)} className="pl-3 pr-9 py-1.5 h-9 text-sm rounded-lg focus-visible:ring-offset-0" />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4">
                            <AnimatePresence mode="popLayout">
                                {query.length > 0 ? (
                                    <motion.div key="send" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ duration: 0.2 }}><Send className="w-4 h-4 text-gray-400 dark:text-gray-500" /></motion.div>
                                ) : (
                                    <motion.div key="search" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ duration: 0.2 }}><Search className="w-4 h-4 text-gray-400 dark:text-gray-500" /></motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
                <div className="w-full max-w-sm">
                    <AnimatePresence>
                        {isFocused && result && !selectedAction && (
                            <motion.div className="w-full border rounded-md shadow-sm overflow-hidden dark:border-gray-800 bg-white dark:bg-black mt-1" variants={container} initial="hidden" animate="show" exit="exit">
                                <motion.ul>
                                    {result.actions.map((action) => (
                                        <motion.li key={action.id} className="px-3 py-2 flex items-center justify-between hover:bg-gray-200 dark:hover:bg-zinc-900 cursor-pointer rounded-md" variants={item} layout onClick={() => setSelectedAction(action)}>
                                            <div className="flex items-center gap-2 justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-500">{action.icon}</span>
                                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{action.label}</span>
                                                    <span className="text-xs text-gray-400">{action.description}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-400">{action.short}</span>
                                                <span className="text-xs text-gray-400 text-right">{action.end}</span>
                                            </div>
                                        </motion.li>
                                    ))}
                                </motion.ul>
                                <div className="mt-2 px-3 py-2 border-t border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>Press ⌘K to open commands</span>
                                        <span>ESC to cancel</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

export { ActionSearchBar };
```

**3. Integration:** Mount `ActionSearchBar` wherever a command center or main search bar logic goes. Map data/props dynamically if required.

---

## Phase 5: Integrate SlidingNumber

**1. Create the Component:**
Path: `components/ui/sliding-number.tsx`
Code:
```tsx
'use client';
import { useEffect, useId } from 'react';
import { MotionValue, motion, useSpring, useTransform, motionValue } from 'framer-motion';
import useMeasure from 'react-use-measure';

const TRANSITION = { type: 'spring', stiffness: 280, damping: 18, mass: 0.3 };

function Digit({ value, place }: { value: number; place: number }) {
  const valueRoundedToPlace = Math.floor(value / place) % 10;
  const initial = motionValue(valueRoundedToPlace);
  const animatedValue = useSpring(initial, TRANSITION);

  useEffect(() => { animatedValue.set(valueRoundedToPlace); }, [animatedValue, valueRoundedToPlace]);

  return (
    <div className='relative inline-block w-[1ch] overflow-x-visible overflow-y-clip leading-none tabular-nums'>
      <div className='invisible'>0</div>
      {Array.from({ length: 10 }, (_, i) => <Number key={i} mv={animatedValue} number={i} />)}
    </div>
  );
}

function Number({ mv, number }: { mv: MotionValue<number>; number: number }) {
  const uniqueId = useId();
  const [ref, bounds] = useMeasure();

  const y = useTransform(mv, (latest) => {
    if (!bounds.height) return 0;
    const placeValue = latest % 10;
    const offset = (10 + number - placeValue) % 10;
    let memo = offset * bounds.height;
    if (offset > 5) memo -= 10 * bounds.height;
    return memo;
  });

  if (!bounds.height) return <span ref={ref} className='invisible absolute'>{number}</span>;

  return (
    <motion.span style={{ y }} layoutId={`${uniqueId}-${number}`} className='absolute inset-0 flex items-center justify-center' transition={TRANSITION} ref={ref}>
      {number}
    </motion.span>
  );
}

export function SlidingNumber({ value, padStart = false, decimalSeparator = '.' }: { value: number; padStart?: boolean; decimalSeparator?: string; }) {
  const absValue = Math.abs(value);
  const [integerPart, decimalPart] = absValue.toString().split('.');
  const integerValue = parseInt(integerPart, 10);
  const paddedInteger = padStart && integerValue < 10 ? `0${integerPart}` : integerPart;
  const integerDigits = paddedInteger.split('');
  const integerPlaces = integerDigits.map((_, i) => Math.pow(10, integerDigits.length - i - 1));

  return (
    <div className='flex items-center'>
      {value < 0 && '-'}
      {integerDigits.map((_, index) => <Digit key={`pos-${integerPlaces[index]}`} value={integerValue} place={integerPlaces[index]} />)}
      {decimalPart && (
        <>
          <span>{decimalSeparator}</span>
          {decimalPart.split('').map((_, index) => <Digit key={`decimal-${index}`} value={parseInt(decimalPart, 10)} place={Math.pow(10, decimalPart.length - index - 1)} />)}
        </>
      )}
    </div>
  );
}
```

**2. Implement Demo/Integration:**
```tsx
'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { SlidingNumber } from '@/components/ui/sliding-number';

export function SlidingNumberBasic() {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (value === 100) return;
    const interval = setInterval(() => { setValue(value + 1); }, 10);
    return () => clearInterval(interval);
  }, [value]);

  return (
    <motion.div initial={{ y: 0, fontSize: `${24}px` }} animate={{ y: 0, fontSize: `${24}px` }} transition={{ ease: [1, 0, 0.35, 0.95], duration: 1.5, delay: 0.3 }} className='leading-none text-black dark:text-white'>
      <div className='inline-flex items-center gap-1 font-mono'>
        <SlidingNumber value={value} />%
      </div>
    </motion.div>
  );
}
```

---

## Phase 6: Architecture Answers & Concrete Integration Targets

All three components must be integrated into **real Solen UI flows**. Do NOT create a separate demo/playground page.

---

### Q1 — Where do these components live in the Solen UI?

| Component | Location | Notes |
|---|---|---|
| `ExpandableTabs` | **Bottom navigation bar on mobile** OR **top filter tabs on the salon discovery/search page** | Replaces whatever nav currently exists on mobile. On desktop, use as category/filter tabs on the search page. |
| `ActionSearchBar` | **Main search bar on the home page / salon discovery screen** | This is the primary entry point for finding salons. Replace or wrap the existing search input with this component. |
| `SlidingNumber` | **Salon detail/profile page stats section** + **user profile total bookings** | Animate ratings, review counts, prices, booking totals. |

---

### Q2 — What real actions does ActionSearchBar handle in Solen?

Replace ALL placeholder demo actions (Book tickets, Talk to Jarvis, etc.) with these Solen-specific actions:

```tsx
const solenActions: Action[] = [
  { id: "1", label: "Find a salon",      icon: <Search className="h-4 w-4 text-violet-500" />,    description: "Browse salons near you",   short: "",   end: "Discovery" },
  { id: "2", label: "Book appointment",  icon: <Calendar className="h-4 w-4 text-blue-500" />,    description: "Schedule a visit",         short: "⌘K", end: "Booking" },
  { id: "3", label: "View my bookings",  icon: <ClipboardList className="h-4 w-4 text-green-500" />, description: "Upcoming & past",       short: "",   end: "Profile" },
  { id: "4", label: "My favourites",     icon: <Heart className="h-4 w-4 text-red-500" />,        description: "Saved salons",             short: "",   end: "Profile" },
  { id: "5", label: "Salon near me",     icon: <MapPin className="h-4 w-4 text-orange-500" />,    description: "Use my location",          short: "",   end: "Nearby" },
];
```

Import the icons from `lucide-react`: `Search`, `Calendar`, `ClipboardList`, `Heart`, `MapPin`.

---

### Q3 — Where does SlidingNumber appear?

**Salon detail / profile page** — animate these stats:
```tsx
// Star rating
<SlidingNumber value={4.7} />

// Number of reviews
<SlidingNumber value={128} /> <span>reviews</span>

// Starting price
<span>CHF </span><SlidingNumber value={35} />
```

**User profile / dashboard** — animate total bookings made:
```tsx
<SlidingNumber value={userTotalBookings} />
```

---

### Final Checklist Before Commit
1. **Lucide Icons**: All SVGs in the app should use `lucide-react` — consistent with the three components.
2. **No placeholder data**: All demo/placeholder data in ActionSearchBar must be replaced with the Solen-specific actions defined in Q2 above.
3. **Mount point**: Each React component mounts into a dedicated `<div id="react-[component-name]">` placeholder inserted into the relevant section of `index.html`.
4. **Responsive**: `ExpandableTabs` must collapse/expand cleanly on mobile (< 640px). `ActionSearchBar` must be full-width on mobile.

```bash
git add -A
git commit -m "feat: integrate ExpandableTabs, ActionSearchBar, SlidingNumber into Solen UI"
git push origin main
```
