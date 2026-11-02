interface IconProps {
  size?: number
  className?: string
}

const props = (size = 16) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

export function PlusIcon({ size, className }: IconProps) {
  return (
    <svg {...props(size)} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function SearchIcon({ size, className }: IconProps) {
  return (
    <svg {...props(size)} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  )
}

export function TrashIcon({ size, className }: IconProps) {
  return (
    <svg {...props(size)} className={className}>
      <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

export function PencilIcon({ size, className }: IconProps) {
  return (
    <svg {...props(size)} className={className}>
      <path d="M4 20h4L20 8l-4-4L4 16v4Z" />
      <path d="m14 6 4 4" />
    </svg>
  )
}

export function SlidersIcon({ size, className }: IconProps) {
  return (
    <svg {...props(size)} className={className}>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2.2" />
      <circle cx="10" cy="17" r="2.2" />
    </svg>
  )
}

export function CloseIcon({ size, className }: IconProps) {
  return (
    <svg {...props(size)} className={className}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  )
}

export function SendIcon({ size, className }: IconProps) {
  return (
    <svg {...props(size)} className={className}>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  )
}

export function StopIcon({ size, className }: IconProps) {
  return (
    <svg {...props(size)} className={className}>
      <rect x="7" y="7" width="10" height="10" rx="2.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function CopyIcon({ size, className }: IconProps) {
  return (
    <svg {...props(size)} className={className}>
      <rect x="9" y="9" width="11" height="11" rx="3" />
      <path d="M15 5.5A2.5 2.5 0 0 0 12.5 4H7a3 3 0 0 0-3 3v5.5A2.5 2.5 0 0 0 6.5 15" />
    </svg>
  )
}

export function CheckIcon({ size, className }: IconProps) {
  return (
    <svg {...props(size)} className={className}>
      <path d="m5 13 4.5 4.5L19 7" />
    </svg>
  )
}

export function RegenerateIcon({ size, className }: IconProps) {
  return (
    <svg {...props(size)} className={className}>
      <path d="M20 11a8 8 0 1 0-2.3 6.4" />
      <path d="M20 4v7h-7" />
    </svg>
  )
}

export function MenuIcon({ size, className }: IconProps) {
  return (
    <svg {...props(size)} className={className}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

export function DownloadIcon({ size, className }: IconProps) {
  return (
    <svg {...props(size)} className={className}>
      <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
    </svg>
  )
}

export function UploadIcon({ size, className }: IconProps) {
  return (
    <svg {...props(size)} className={className}>
      <path d="M12 16V5M7 10l5-5 5 5M5 20h14" />
    </svg>
  )
}

export function EyeIcon({ size, className }: IconProps) {
  return (
    <svg {...props(size)} className={className}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function EyeOffIcon({ size, className }: IconProps) {
  return (
    <svg {...props(size)} className={className}>
      <path d="M3 3l18 18" />
      <path d="M10.6 6.2A9.9 9.9 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3 3.7M6.3 7.8A16.8 16.8 0 0 0 2.5 12S6 18 12 18a9.6 9.6 0 0 0 3.2-.5" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  )
}
