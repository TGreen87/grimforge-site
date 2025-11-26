/**
 * Global Admin Styles
 *
 * Additional CSS for the gothic admin theme that can't be
 * achieved through Ant Design tokens alone.
 */

import { cssVariables, colors, shadows, typography, animation } from './tokens';

export const globalAdminStyles = `
  ${cssVariables}

  /* ============================================
     BASE STYLES
     ============================================ */

  /* Admin root container */
  .admin-root {
    background: ${colors.bg.base};
    min-height: 100vh;
    color: ${colors.text.high};
    font-family: ${typography.fontFamily.body};
  }

  /* Subtle texture overlay for depth */
  .admin-root::before {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    opacity: 0.015;
    z-index: 0;
  }

  /* ============================================
     TYPOGRAPHY
     ============================================ */

  .admin-heading {
    font-family: ${typography.fontFamily.heading};
    font-weight: ${typography.fontWeight.semibold};
    letter-spacing: 0.02em;
    color: ${colors.text.high};
  }

  .admin-heading-xl {
    font-size: ${typography.fontSize['3xl']};
    line-height: ${typography.lineHeight.tight};
  }

  .admin-heading-lg {
    font-size: ${typography.fontSize['2xl']};
    line-height: ${typography.lineHeight.tight};
  }

  .admin-heading-md {
    font-size: ${typography.fontSize.xl};
    line-height: ${typography.lineHeight.tight};
  }

  .admin-mono {
    font-family: ${typography.fontFamily.mono};
    font-size: ${typography.fontSize.sm};
    letter-spacing: 0.01em;
  }

  /* ============================================
     LAYOUT COMPONENTS
     ============================================ */

  /* Sidebar styling */
  .admin-sider {
    background: linear-gradient(180deg, ${colors.bg.elevated0} 0%, ${colors.bg.base} 100%) !important;
    border-right: 1px solid ${colors.border.subtle};
    position: relative;
  }

  .admin-sider::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 1px;
    height: 100%;
    background: linear-gradient(180deg, ${colors.primary.DEFAULT}20 0%, transparent 50%, ${colors.primary.DEFAULT}20 100%);
  }

  /* Header styling */
  .admin-header {
    background: ${colors.bg.elevated0} !important;
    border-bottom: 1px solid ${colors.border.subtle};
    backdrop-filter: blur(8px);
  }

  /* Content area */
  .admin-content {
    background: ${colors.bg.base};
    position: relative;
    z-index: 1;
  }

  /* ============================================
     CARDS & PANELS
     ============================================ */

  .admin-card {
    background: ${colors.bg.elevated0};
    border: 1px solid ${colors.border.subtle};
    border-radius: 8px;
    box-shadow: ${shadows.sm};
    transition: all ${animation.duration.normal} ${animation.easing.DEFAULT};
  }

  .admin-card:hover {
    border-color: ${colors.border.DEFAULT};
    box-shadow: ${shadows.DEFAULT};
  }

  .admin-card-header {
    padding: 16px 20px;
    border-bottom: 1px solid ${colors.border.subtle};
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .admin-card-body {
    padding: 20px;
  }

  /* Metric cards with glow */
  .admin-metric-card {
    background: linear-gradient(135deg, ${colors.bg.elevated0} 0%, ${colors.bg.elevated1} 100%);
    border: 1px solid ${colors.border.subtle};
    border-radius: 12px;
    padding: 20px;
    position: relative;
    overflow: hidden;
  }

  .admin-metric-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, ${colors.primary.DEFAULT}60, transparent);
  }

  .admin-metric-value {
    font-size: ${typography.fontSize['2xl']};
    font-weight: ${typography.fontWeight.bold};
    color: ${colors.text.high};
    font-family: ${typography.fontFamily.mono};
  }

  .admin-metric-label {
    font-size: ${typography.fontSize.sm};
    color: ${colors.text.medium};
    margin-top: 4px;
  }

  .admin-metric-change {
    font-size: ${typography.fontSize.xs};
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: ${typography.fontWeight.medium};
  }

  .admin-metric-change.positive {
    background: ${colors.success.bg};
    color: ${colors.success.text};
  }

  .admin-metric-change.negative {
    background: ${colors.danger.bg};
    color: ${colors.danger.text};
  }

  /* ============================================
     NAVIGATION
     ============================================ */

  /* Nav group headers */
  .admin-nav-group {
    margin-bottom: 16px;
  }

  .admin-nav-group-header {
    padding: 8px 16px;
    font-size: 11px;
    font-weight: ${typography.fontWeight.semibold};
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: ${colors.text.low};
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .admin-nav-group-header::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${colors.border.subtle};
  }

  /* Menu item active indicator */
  .ant-menu-dark .ant-menu-item-selected {
    position: relative;
    background: ${colors.primary.ghost} !important;
  }

  .ant-menu-dark .ant-menu-item-selected::before {
    content: '';
    position: absolute;
    left: 0;
    top: 4px;
    bottom: 4px;
    width: 3px;
    background: ${colors.primary.DEFAULT};
    border-radius: 0 2px 2px 0;
  }

  /* Badge on nav items */
  .admin-nav-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 6px;
    font-size: 10px;
    font-weight: ${typography.fontWeight.bold};
    background: ${colors.danger.text};
    color: ${colors.text.inverse};
    border-radius: 9px;
    margin-left: auto;
  }

  /* ============================================
     TABLES
     ============================================ */

  /* Zebra striping */
  .ant-table-tbody > tr.admin-row-zebra > td {
    background: ${colors.bg.base} !important;
  }

  /* Row hover glow */
  .ant-table-tbody > tr:hover > td {
    background: ${colors.bg.elevated1} !important;
  }

  /* Selected row */
  .ant-table-tbody > tr.ant-table-row-selected > td {
    background: ${colors.primary.ghost} !important;
  }

  /* Sticky header enhancement */
  .ant-table-thead > tr > th {
    background: ${colors.bg.elevated1} !important;
    font-weight: ${typography.fontWeight.semibold};
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: ${colors.text.medium} !important;
    border-bottom: 2px solid ${colors.border.DEFAULT} !important;
  }

  /* ============================================
     KANBAN BOARD
     ============================================ */

  .admin-kanban-container {
    display: flex;
    gap: 16px;
    overflow-x: auto;
    padding-bottom: 16px;
    -webkit-overflow-scrolling: touch;
  }

  .admin-kanban-column {
    flex: 0 0 320px;
    background: ${colors.bg.elevated0};
    border: 1px solid ${colors.border.subtle};
    border-radius: 12px;
    min-height: 400px;
    display: flex;
    flex-direction: column;
  }

  .admin-kanban-column-header {
    padding: 12px 16px;
    border-bottom: 1px solid ${colors.border.subtle};
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: ${typography.fontWeight.semibold};
  }

  .admin-kanban-column-count {
    font-size: 12px;
    font-weight: ${typography.fontWeight.medium};
    color: ${colors.text.low};
    background: ${colors.bg.elevated1};
    padding: 2px 8px;
    border-radius: 4px;
  }

  .admin-kanban-column-body {
    flex: 1;
    padding: 12px;
    overflow-y: auto;
  }

  .admin-kanban-card {
    background: ${colors.bg.elevated1};
    border: 1px solid ${colors.border.subtle};
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 8px;
    cursor: grab;
    transition: all ${animation.duration.fast} ${animation.easing.DEFAULT};
  }

  .admin-kanban-card:hover {
    border-color: ${colors.border.DEFAULT};
    box-shadow: ${shadows.sm};
    transform: translateY(-1px);
  }

  .admin-kanban-card.dragging {
    opacity: 0.9;
    transform: scale(1.02) rotate(1deg);
    box-shadow: ${shadows.lg};
    cursor: grabbing;
    border-color: ${colors.primary.DEFAULT};
  }

  .admin-kanban-column.drop-target {
    border-color: ${colors.primary.DEFAULT};
    background: ${colors.primary.ghost};
  }

  .admin-kanban-column.drop-target .admin-kanban-column-header {
    color: ${colors.primary.DEFAULT};
  }

  /* ============================================
     FORMS & INPUTS
     ============================================ */

  /* Focus ring */
  .ant-input:focus,
  .ant-input-focused,
  .ant-select-focused .ant-select-selector,
  .ant-picker-focused {
    border-color: ${colors.primary.DEFAULT} !important;
    box-shadow: 0 0 0 2px ${colors.primary.ghost} !important;
  }

  /* ============================================
     BUTTONS
     ============================================ */

  .admin-btn-primary {
    background: ${colors.primary.DEFAULT} !important;
    border-color: ${colors.primary.DEFAULT} !important;
    font-weight: ${typography.fontWeight.medium};
    transition: all ${animation.duration.fast} ${animation.easing.DEFAULT};
  }

  .admin-btn-primary:hover {
    background: ${colors.primary.hover} !important;
    border-color: ${colors.primary.hover} !important;
    box-shadow: ${shadows.glow.blood};
  }

  .admin-btn-accent {
    background: ${colors.accent.DEFAULT} !important;
    border-color: ${colors.accent.DEFAULT} !important;
    color: ${colors.text.inverse} !important;
  }

  .admin-btn-accent:hover {
    background: ${colors.accent.hover} !important;
    box-shadow: ${shadows.glow.teal};
  }

  /* ============================================
     STATUS INDICATORS
     ============================================ */

  .admin-status-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 8px;
  }

  .admin-status-dot.success { background: ${colors.success.text}; box-shadow: 0 0 8px ${colors.success.text}40; }
  .admin-status-dot.warning { background: ${colors.warning.text}; box-shadow: 0 0 8px ${colors.warning.text}40; }
  .admin-status-dot.danger { background: ${colors.danger.text}; box-shadow: 0 0 8px ${colors.danger.text}40; }
  .admin-status-dot.info { background: ${colors.info.text}; box-shadow: 0 0 8px ${colors.info.text}40; }
  .admin-status-dot.neutral { background: ${colors.text.low}; }

  /* Pulsing animation for active states */
  .admin-status-dot.pulse {
    animation: admin-pulse 2s ease-in-out infinite;
  }

  @keyframes admin-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.1); }
  }

  /* ============================================
     SCROLLBARS
     ============================================ */

  .admin-root ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  .admin-root ::-webkit-scrollbar-track {
    background: ${colors.bg.base};
    border-radius: 4px;
  }

  .admin-root ::-webkit-scrollbar-thumb {
    background: ${colors.border.DEFAULT};
    border-radius: 4px;
    border: 2px solid ${colors.bg.base};
  }

  .admin-root ::-webkit-scrollbar-thumb:hover {
    background: ${colors.text.low};
  }

  /* ============================================
     MOBILE OPTIMIZATIONS
     ============================================ */

  @media (max-width: 768px) {
    .admin-kanban-container {
      gap: 12px;
    }

    .admin-kanban-column {
      flex: 0 0 280px;
    }

    .admin-metric-card {
      padding: 16px;
    }

    .admin-metric-value {
      font-size: ${typography.fontSize.xl};
    }

    /* Bottom action bar on mobile */
    .admin-mobile-actions {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 12px 16px;
      background: ${colors.bg.elevated1};
      border-top: 1px solid ${colors.border.DEFAULT};
      display: flex;
      gap: 8px;
      z-index: 100;
      box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.3);
    }

    .admin-mobile-actions button {
      flex: 1;
    }
  }

  /* ============================================
     ANIMATIONS
     ============================================ */

  @keyframes admin-fade-in {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes admin-slide-in-right {
    from { opacity: 0; transform: translateX(16px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @keyframes admin-scale-in {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  .admin-animate-fade-in {
    animation: admin-fade-in ${animation.duration.normal} ${animation.easing.out};
  }

  .admin-animate-slide-in {
    animation: admin-slide-in-right ${animation.duration.normal} ${animation.easing.out};
  }

  .admin-animate-scale-in {
    animation: admin-scale-in ${animation.duration.fast} ${animation.easing.bounce};
  }

  /* Skeleton loading shimmer */
  .admin-skeleton {
    background: linear-gradient(
      90deg,
      ${colors.bg.elevated1} 0%,
      ${colors.bg.elevated2} 50%,
      ${colors.bg.elevated1} 100%
    );
    background-size: 200% 100%;
    animation: admin-shimmer 1.5s ease-in-out infinite;
    border-radius: 4px;
  }

  @keyframes admin-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;
