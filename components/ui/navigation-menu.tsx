"use client"

import * as React from "react"
import Link from "next/link"

type DivProps = React.HTMLAttributes<HTMLDivElement>
type UlProps = React.HTMLAttributes<HTMLUListElement>
type LiProps = React.HTMLAttributes<HTMLLIElement>
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>

export function navigationMenuTriggerStyle() {
  return "px-3 py-2 rounded-md text-slate-200 hover:text-amber-400 hover:bg-slate-800 transition-colors"
}

export const NavigationMenu = ({ children, className, ...props }: DivProps & { viewport?: boolean }) => (
  <div className={`relative ${className ?? ""}`} {...props}>{children}</div>
)

export const NavigationMenuList = ({ children, className, ...props }: UlProps) => (
  <ul className={`flex items-center gap-4 ${className ?? ""}`} {...props}>{children}</ul>
)

export const NavigationMenuItem = ({ children, className, ...props }: LiProps) => (
  <li className={`relative group ${className ?? ""}`} {...props}>{children}</li>
)

export const NavigationMenuTrigger = ({ children, className, ...props }: ButtonProps) => (
  <button className={`${navigationMenuTriggerStyle()} ${className ?? ""}`} {...props}>{children}</button>
)

export const NavigationMenuContent = ({ children, className, ...props }: DivProps) => (
  <div className={`absolute left-0 top-full z-50 hidden group-hover:block bg-slate-900 border border-slate-700 rounded-md shadow-lg p-3 ${className ?? ""}`} {...props}>
    {children}
  </div>
)

export const NavigationMenuLink = React.forwardRef<HTMLAnchorElement, React.ComponentPropsWithoutRef<typeof Link>>(
  function NavLink({ className, ...props }, ref) {
    // eslint-disable-next-line jsx-a11y/anchor-is-valid
    return <Link ref={ref as any} className={className} {...props} />
  }
)
