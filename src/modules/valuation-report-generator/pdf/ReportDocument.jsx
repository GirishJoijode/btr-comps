import { Document } from '@react-pdf/renderer'
import SectionDividerPage from './components/SectionDivider'
import { reportPlan } from './outline'
import CashflowPage from './pages/CashflowPage'
import ContentsPage from './pages/ContentsPage'
import CoverPage from './pages/CoverPage'
import ExecutiveSummaryPage from './pages/ExecutiveSummaryPage'
import FurtherInformationPage from './pages/FurtherInformationPage'
import IncomeAnalysisPage from './pages/IncomeAnalysisPage'
import IncomeOccupancyPage from './pages/IncomeOccupancyPage'
import LettingProfilePage from './pages/LettingProfilePage'
import MarketRentSummaryPage from './pages/MarketRentSummaryPage'
import OperatingCostsPage from './pages/OperatingCostsPage'
import PropertyOverviewPage from './pages/PropertyOverviewPage'
import RentalBenchmarkPage from './pages/RentalBenchmarkPage'
import RentalEvidencePage from './pages/RentalEvidencePage'
import RunningCostsMarketPage from './pages/RunningCostsMarketPage'
import ValuationReturnsPage from './pages/ValuationReturnsPage'

export default function ReportDocument({ model }) {
  const plan = reportPlan(model)
  const furtherSection = plan.sections.find((item) => item.key === 'further')?.number || null
  return (
    <Document
      title={`${model.meta.propertyName || 'Property'} Valuation Summary`}
      author="BTR Valuation Summary"
    >
      {plan.pages.map((page, index) => {
        const key = `${page.id}-${index}`
        const section = page.section
        switch (page.id) {
          case 'cover':
            return <CoverPage key={key} model={model} />
          case 'contents':
            return <ContentsPage key={key} model={model} outline={plan.sections} />
          case 'exec':
            return <ExecutiveSummaryPage key={key} model={model} />
          case 'divider':
            return (
              <SectionDividerPage
                key={key}
                model={model}
                kicker={page.kicker}
                title={page.title}
                lede={page.lede}
                image={page.image}
              />
            )
          case 'property':
            return <PropertyOverviewPage key={key} model={model} section={section} furtherSection={furtherSection} />
          case 'income':
            return <IncomeOccupancyPage key={key} model={model} section={section} />
          case 'letting':
            return <LettingProfilePage key={key} model={model} section={section} />
          case 'analysis':
            return <IncomeAnalysisPage key={key} model={model} section={section} />
          case 'costs':
            return <OperatingCostsPage key={key} model={model} section={section} />
          case 'marketSummary':
            return <MarketRentSummaryPage key={key} model={model} section={section} />
          case 'runningCosts':
            return <RunningCostsMarketPage key={key} model={model} section={section} />
          case 'evidence':
            return <RentalEvidencePage key={key} model={model} section={section} />
          case 'benchmarkRent':
            return <RentalBenchmarkPage key={key} model={model} metric="rent" section={section} />
          case 'benchmarkPsf':
            return <RentalBenchmarkPage key={key} model={model} metric="psf" section={section} />
          case 'valuation':
            return <ValuationReturnsPage key={key} model={model} section={section} />
          case 'cashflow':
            return <CashflowPage key={key} model={model} section={section} />
          case 'further':
            return <FurtherInformationPage key={key} model={model} section={section} />
          default:
            return null
        }
      })}
    </Document>
  )
}
