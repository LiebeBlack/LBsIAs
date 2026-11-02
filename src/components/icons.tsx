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

export function PaperclipIcon({ size, className }: IconProps) {
  return (
    <svg {...props(size)} className={className}>
      <path d="M20.5 11.5 12 20a5.5 5.5 0 0 1-7.8-7.8l8.5-8.5a3.7 3.7 0 0 1 5.2 5.2l-8.5 8.5a1.8 1.8 0 0 1-2.6-2.6l7.9-7.9" />
    </svg>
  )
}

export function SparklesIcon({ size, className }: IconProps) {
  return (
    <svg {...props(size)} className={className}>
      <path d="M12 3.5 13.6 9 19 10.6 13.6 12.2 12 17.7 10.4 12.2 5 10.6 10.4 9 12 3.5Z" />
      <path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
    </svg>
  )
}

export function CommandIcon({ size, className }: IconProps) {
  return (
    <svg {...props(size)} className={className}>
      <path d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6Z" />
    </svg>
  )
}

export function FileIcon({ size, className }: IconProps) {
  return (
    <svg {...props(size)} className={className}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path d="M14 3v5h5" />
    </svg>
  )
}

export function WifiIcon({ size, className }: IconProps) {
  return (
    <svg {...props(size)} className={className}>
      <path d="M4 9a13 13 0 0 1 16 0M7 12.5a8.5 8.5 0 0 1 10 0M10 16a4 4 0 0 1 4 0" />
      <circle cx="12" cy="19.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function WifiOffIcon({ size, className }: IconProps) {
  return (
    <svg {...props(size)} className={className}>
      <path d="m3 3 18 18" />
      <path d="M4 9a13 13 0 0 1 4-2.6M12 5c3 0 5.8 1.4 8 4M7 12.5a8.5 8.5 0 0 1 2.6-1.3M15 11.8a8.5 8.5 0 0 1 2 1.2M10 16a4 4 0 0 1 4 0" />
      <circle cx="12" cy="19.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function GlobeIcon({ size, className }: IconProps) {
  return (
    <svg {...props(size)} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.3 3.6 8.5S14.4 18.1 12 20.5C9.6 18.1 8.4 15.2 8.4 12S9.6 5.9 12 3.5Z" />
    </svg>
  )
}
