"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, Calendar, Mail, ListTodo, MessageSquare } from "lucide-react";

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
        <div
            onMouseEnter={() => setExpanded(true)}
            onMouseLeave={() => setExpanded(false)}
            className={`h-screen bg-gray-900 text-gray-100 flex flex-col py-4 transition-all duration-200 ${
                expanded ? "w-48" : "w-16"
            }`}
        >
            {links.map((link) => {
                const Icon = link.icon;
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center gap-3 px-5 py-3 text-gray-100 hover:bg-gray-800 hover:text-white whitespace-nowrap overflow-hidden"
                    >
                        <Icon size={20} className="shrink-0 text-gray-100" />
                        {expanded && <span>{link.label}</span>}
                    </Link>
                );
            })}
        </div>
    );
}