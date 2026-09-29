import { Document } from '@react-pdf/renderer'
import SectionDividerPage from './components/SectionDivider'
import CoverPage from './pages/CoverPage'
import ExecutiveSummaryPage from './pages/ExecutiveSummaryPage'
import IncomeAnalysisPage from './pages/IncomeAnalysisPage'
import IncomeOccupancyPage from './pages/IncomeOccupancyPage'
import MarketRentDetailPage from './pages/MarketRentDetailPage'
import MarketRentSummaryPage from './pages/MarketRentSummaryPage'
import OperatingCostsPage from './pages/OperatingCostsPage'
import PropertyOverviewPage from './pages/PropertyOverviewPage'
import RentalBenchmarkPage from './pages/RentalBenchmarkPage'
import RentalEvidencePage from './pages/RentalEvidencePage'

export default function ReportDocument({ model }) {
  const place = [model.meta.propertyName, model.meta.location].filter(Boolean).join(', ')
  return (
    <Document
      title={`${model.meta.propertyName || 'Property'} Valuation Summary`}
      author="Savills Operational Investment Valuations"
    >
      <CoverPage model={model} />
      <ExecutiveSummaryPage model={model} />
      <SectionDividerPage
        model={model}
        kicker="PROPERTY AND INCOME"
        title="Property & income summary"
        lede={`Current passing income, occupancy and operating costs for ${place || 'the subject property'}.`}
        image={model.images.propertyImage}
      />
      <PropertyOverviewPage model={model} />
      <IncomeOccupancyPage model={model} />
      <IncomeAnalysisPage model={model} />
      <OperatingCostsPage model={model} />
      <SectionDividerPage
        model={model}
        kicker="MARKET RENT"
        title="Market rent summary"
        lede="ERV and net market rent are kept separate from the current passing income and cost pages."
      />
      <MarketRentSummaryPage model={model} />
      <MarketRentDetailPage model={model} />
      <RentalEvidencePage model={model} />
      <RentalBenchmarkPage model={model} metric="rent" />
      <RentalBenchmarkPage model={model} metric="psf" />
    </Document>
  )
}
