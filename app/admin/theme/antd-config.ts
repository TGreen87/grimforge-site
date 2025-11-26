/**
 * Ant Design Theme Configuration
 *
 * Maps our gothic design tokens to Ant Design's theme system.
 */

import { ThemeConfig } from 'antd';
import { colors, radius, shadows, typography } from './tokens';

export const antdThemeConfig: ThemeConfig = {
  token: {
    // Colors
    colorPrimary: colors.primary.DEFAULT,
    colorInfo: colors.accent.DEFAULT,
    colorSuccess: colors.success.text,
    colorWarning: colors.warning.text,
    colorError: colors.danger.text,
    colorLink: colors.accent.DEFAULT,

    // Backgrounds
    colorBgBase: colors.bg.base,
    colorBgContainer: colors.bg.elevated0,
    colorBgElevated: colors.bg.elevated1,
    colorBgSpotlight: colors.bg.elevated2,
    colorBgLayout: colors.bg.base,

    // Text
    colorText: colors.text.high,
    colorTextSecondary: colors.text.medium,
    colorTextTertiary: colors.text.low,
    colorTextQuaternary: colors.text.low,

    // Borders
    colorBorder: colors.border.DEFAULT,
    colorBorderSecondary: colors.border.subtle,

    // Border radius
    borderRadius: 6,
    borderRadiusSM: 4,
    borderRadiusLG: 12,
    borderRadiusXS: 2,

    // Typography
    fontFamily: typography.fontFamily.body,
    fontSize: 14,
    fontSizeSM: 13,
    fontSizeLG: 16,
    fontSizeHeading1: 36,
    fontSizeHeading2: 28,
    fontSizeHeading3: 22,
    fontSizeHeading4: 18,
    fontSizeHeading5: 15,

    // Motion
    motionDurationFast: '100ms',
    motionDurationMid: '200ms',
    motionDurationSlow: '300ms',

    // Shadows
    boxShadow: shadows.DEFAULT,
    boxShadowSecondary: shadows.sm,

    // Misc
    wireframe: false,
  },

  components: {
    Layout: {
      bodyBg: colors.bg.base,
      headerBg: colors.bg.elevated0,
      siderBg: colors.bg.elevated0,
      triggerBg: colors.bg.elevated1,
      lightTriggerBg: colors.bg.elevated1,
    },

    Menu: {
      darkItemBg: 'transparent',
      darkSubMenuItemBg: 'transparent',
      darkItemSelectedBg: colors.primary.ghost,
      darkItemSelectedColor: colors.text.high,
      darkItemHoverBg: colors.bg.elevated1,
      darkItemHoverColor: colors.text.high,
      itemMarginBlock: 4,
      itemMarginInline: 8,
      itemPaddingInline: 12,
      itemBorderRadius: 6,
      iconSize: 16,
      collapsedIconSize: 18,
    },

    Table: {
      headerBg: colors.bg.elevated1,
      headerColor: colors.text.high,
      headerSortActiveBg: colors.bg.elevated2,
      headerSortHoverBg: colors.bg.elevated2,
      rowHoverBg: colors.bg.elevated1,
      rowSelectedBg: colors.primary.ghost,
      rowSelectedHoverBg: 'rgba(139, 0, 0, 0.18)',
      borderColor: colors.border.subtle,
      headerBorderRadius: 8,
      cellPaddingBlock: 12,
      cellPaddingInline: 16,
    },

    Button: {
      primaryColor: colors.text.high,
      colorPrimaryHover: colors.primary.hover,
      colorPrimaryActive: colors.primary.active,
      defaultBg: colors.bg.elevated1,
      defaultColor: colors.text.high,
      defaultBorderColor: colors.border.DEFAULT,
      defaultHoverBg: colors.bg.elevated2,
      defaultHoverColor: colors.text.high,
      defaultHoverBorderColor: colors.border.DEFAULT,
      ghostBg: 'transparent',
      borderRadiusSM: 4,
      borderRadiusLG: 8,
      paddingInlineSM: 12,
      paddingInline: 16,
      paddingInlineLG: 20,
    },

    Input: {
      activeBorderColor: colors.primary.DEFAULT,
      hoverBorderColor: colors.border.DEFAULT,
      activeShadow: `0 0 0 2px ${colors.primary.ghost}`,
      colorBgContainer: colors.bg.elevated0,
      paddingInline: 12,
      paddingBlock: 8,
    },

    Select: {
      optionSelectedBg: colors.primary.ghost,
      optionActiveBg: colors.bg.elevated1,
      selectorBg: colors.bg.elevated0,
    },

    Card: {
      colorBgContainer: colors.bg.elevated0,
      colorBorderSecondary: colors.border.subtle,
      paddingLG: 20,
    },

    Modal: {
      contentBg: colors.bg.elevated1,
      headerBg: colors.bg.elevated1,
      footerBg: colors.bg.elevated1,
      titleColor: colors.text.high,
    },

    Drawer: {
      colorBgElevated: colors.bg.elevated1,
    },

    Dropdown: {
      colorBgElevated: colors.bg.elevated2,
      controlItemBgHover: colors.bg.elevated3,
    },

    Popover: {
      colorBgElevated: colors.bg.elevated2,
    },

    Tooltip: {
      colorBgSpotlight: colors.bg.elevated3,
      colorTextLightSolid: colors.text.high,
    },

    Tag: {
      defaultBg: colors.bg.elevated1,
      defaultColor: colors.text.medium,
    },

    Badge: {
      colorBgContainer: colors.danger.text,
      textFontSize: 11,
      textFontSizeSM: 10,
    },

    Tabs: {
      inkBarColor: colors.primary.DEFAULT,
      itemSelectedColor: colors.text.high,
      itemHoverColor: colors.text.high,
      itemActiveColor: colors.primary.DEFAULT,
    },

    Breadcrumb: {
      itemColor: colors.text.medium,
      lastItemColor: colors.text.high,
      linkColor: colors.text.medium,
      linkHoverColor: colors.accent.DEFAULT,
      separatorColor: colors.text.low,
    },

    Segmented: {
      itemSelectedBg: colors.bg.elevated2,
      itemHoverBg: colors.bg.elevated1,
      trackBg: colors.bg.elevated0,
    },

    Progress: {
      defaultColor: colors.primary.DEFAULT,
      remainingColor: colors.bg.elevated2,
    },

    Spin: {
      colorPrimary: colors.primary.DEFAULT,
    },

    Pagination: {
      itemBg: 'transparent',
      itemActiveBg: colors.primary.ghost,
      itemInputBg: colors.bg.elevated0,
    },

    Statistic: {
      contentFontSize: 28,
      titleFontSize: 13,
    },

    Form: {
      labelColor: colors.text.medium,
      labelRequiredMarkColor: colors.danger.text,
    },

    DatePicker: {
      cellActiveWithRangeBg: colors.primary.ghost,
      cellHoverBg: colors.bg.elevated1,
    },

    Notification: {
      colorBgElevated: colors.bg.elevated2,
    },

    Message: {
      contentBg: colors.bg.elevated2,
    },

    Alert: {
      colorInfoBg: colors.info.bg,
      colorInfoBorder: colors.info.border,
      colorSuccessBg: colors.success.bg,
      colorSuccessBorder: colors.success.border,
      colorWarningBg: colors.warning.bg,
      colorWarningBorder: colors.warning.border,
      colorErrorBg: colors.danger.bg,
      colorErrorBorder: colors.danger.border,
    },

    Empty: {
      colorTextDescription: colors.text.low,
    },

    Timeline: {
      tailColor: colors.border.DEFAULT,
      dotBg: 'transparent',
    },
  },
};
