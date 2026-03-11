/**
 * src/views/dashboard/index.js — Enhanced provider dashboard entry point.
 *
 * Phase 3: re-exports all dashboard view components.
 *
 * To use in the legacy inline dashboard (index.html), add to main.js:
 *   window.solenModules.DashboardCalendar = DashboardCalendar;
 *   window.solenModules.NotificationCenter = NotificationCenter;
 *   window.solenModules.renderRevenueChart = renderRevenueChart;
 *   window.solenModules.renderTopServicesChart = renderTopServicesChart;
 *   window.solenModules.renderPeakHoursChart = renderPeakHoursChart;
 */

export { DashboardCalendar } from './calendar.js';
export { NotificationCenter } from './notifications.js';
export {
  renderRevenueChart,
  renderTopServicesChart,
  renderPeakHoursChart,
} from './revenue-chart.js';
