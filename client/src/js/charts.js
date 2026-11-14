/**
 * VAMS Analytics & Dashboard Charts Manager
 * Uses Chart.js to render responsive, interactive charts dynamically calculated
 * from the VAMS localStorage data store.
 */

let revenueChartInstance = null;
let categoryChartInstance = null;
let budgetChartInstance = null;

export function renderDashboardCharts(store) {
  if (!window.Chart) {
    console.warn('Chart.js library not loaded yet.');
    return;
  }

  const events = store.getEvents();
  const attendees = store.getAttendees();
  const budget = store.getBudget();

  // 1. Registration & Ticket Revenue Trend Chart
  const revenueCanvas = document.getElementById('chart-revenue-trends');
  if (revenueCanvas) {
    if (revenueChartInstance) revenueChartInstance.destroy();

    const labels = ['Nov 10', 'Nov 11', 'Nov 12', 'Nov 13', 'Nov 14', 'Nov 15', 'Nov 16'];
    const rsvpCounts = [42, 58, 85, 112, 145, 178, attendees.length * 15];
    const revenueVals = rsvpCounts.map(count => count * 180);

    revenueChartInstance = new window.Chart(revenueCanvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Total RSVPs',
            data: rsvpCounts,
            borderColor: '#7357FF',
            backgroundColor: 'rgba(115, 87, 255, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            yAxisID: 'y'
          },
          {
            label: 'Revenue (₹)',
            data: revenueVals,
            borderColor: '#00C2D7',
            backgroundColor: 'rgba(0, 194, 215, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { font: { family: 'Plus Jakarta Sans', size: 12 } } },
          tooltip: { padding: 10 }
        },
        scales: {
          y: { type: 'linear', display: true, position: 'left', grid: { color: '#EDF2F7' } },
          y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // 2. Category Distribution Doughnut Chart
  const categoryCanvas = document.getElementById('chart-category-dist');
  if (categoryCanvas) {
    if (categoryChartInstance) categoryChartInstance.destroy();

    const catMap = {};
    events.forEach(e => {
      catMap[e.category] = (catMap[e.category] || 0) + 1;
    });

    const labels = Object.keys(catMap);
    const data = Object.values(catMap);

    categoryChartInstance = new window.Chart(categoryCanvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: ['#7357FF', '#00C2D7', '#16A34A', '#F59E0B', '#EF4444', '#14213D'],
          borderWidth: 2,
          borderColor: '#FFFFFF'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Plus Jakarta Sans', size: 11 } } }
        },
        cutout: '65%'
      }
    });
  }

  // 3. Budget Expenses Breakdown Chart (Budget Tab)
  const budgetCanvas = document.getElementById('chart-budget-expenses');
  if (budgetCanvas) {
    if (budgetChartInstance) budgetChartInstance.destroy();

    const expenseMap = {};
    (budget.expenses || []).forEach(exp => {
      expenseMap[exp.category] = (expenseMap[exp.category] || 0) + exp.amount;
    });

    budgetChartInstance = new window.Chart(budgetCanvas, {
      type: 'bar',
      data: {
        labels: Object.keys(expenseMap),
        datasets: [{
          label: 'Expense Amount (₹)',
          data: Object.values(expenseMap),
          backgroundColor: '#7357FF',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { grid: { color: '#EDF2F7' } },
          x: { grid: { display: false } }
        }
      }
    });
  }
}

