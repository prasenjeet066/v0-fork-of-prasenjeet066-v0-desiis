import type React from "react"

export interface VerificationBadgeProps {
  verified?: boolean
  label?: string
  size?: number // px
  className?: string
}

/**
 * VerificationBadge - A badge to indicate verified status, using a custom SVG icon.
 *
 * @param verified - Whether the badge is shown (default: true)
 * @param label - Tooltip text (default: "Verified")
 * @param size - SVG size in px (default: 24)
 * @param className - Additional classes
 */
const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  verified = true,
  label = "Verified",
  size = 24,
  className = "",
}) => {
  if (!verified) return null
  return (
    <span
      className={`inline-flex items-center ${className}`}
      title={label}
      style={{ width: size, height: size }}
      aria-label={label}
      data-testid="verification-badge"
    >
      <svg
  width={size}
  height={size}
  viewBox="-2.4 -2.4 28.80 28.80"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  aria-hidden="true"
>
  <defs>
    <linearGradient id="badge-gradient" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#a18cd1"/>
      <stop offset="100%" stopColor="#6a82fb"/>
    </linearGradient>
  </defs>
  <g>
    <path
      d="M11.5283 1.5999C11.7686 1.29437 12.2314 1.29437 12.4717 1.5999L14.2805 3.90051C14.4309 4.09173 14.6818 4.17325 14.9158 4.10693L17.7314 3.3089C18.1054 3.20292 18.4799 3.475 18.4946 3.863[...]"
      fill="url(#badge-gradient)"
      stroke="#000"
      strokeWidth="0.936"
    />
    <path d="M9 12L11 14L15 10" stroke="#000" strokeWidth="0.936" strokeLinecap="round" strokeLinejoin="round" />
  </g>
</svg>
    </span>
  )
}

export { VerificationBadge }
export default VerificationBadge
