// Configuración lazy de Chart.js para reducir bundle size
let chartInitialized = false;

export const initializeChart = async () => {
  if (chartInitialized) return;
  
  const {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
  } = await import('chart.js');

  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
  );
  
  chartInitialized = true;
  return ChartJS;
};