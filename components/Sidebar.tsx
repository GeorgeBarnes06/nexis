"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Home,
    Calendar,
    Mail,
    ListTodo,
    MessageSquare,
} from "lucide-react";

const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/mail", label: "Mail", icon: Mail },
    { href: "/tasks", label: "Tasks", icon: ListTodo },
    { href: "/assistant", label: "Assistant", icon: MessageSquare },
];

export default function Sidebar() {
    const [expanded, setExpanded] = useState(false);

    return (
        <aside
            onMouseEnter={() => setExpanded(true)}
            onMouseLeave={() => setExpanded(false)}
            className={`
                fixed left-0 top-0 z-50
                h-screen
                bg-gray-900
                text-white
                flex flex-col
                py-4
                border-r border-gray-700
                shadow-lg
                transition-all duration-200 ease-in-out
                ${expanded ? "w-48" : "w-16"}
            `}
        >
            {links.map((link) => {
                const Icon = link.icon;

                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className="
                            flex items-center
                            gap-3
                            px-5 py-3
                            text-white
                            hover:bg-gray-800
                            transition-colors
                            whitespace-nowrap
                            overflow-hidden
                        "
                    >
                        <Icon
                            size={20}
                            strokeWidth={2}
                            className="shrink-0 text-white"
                        />

                        {expanded && (
                            <span className="text-sm font-medium">
                                {link.label}
                            </span>
                        )}
                    </Link>
                );
            })}
        </aside>
    );
}