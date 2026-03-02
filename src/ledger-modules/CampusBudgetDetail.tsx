import { FileText } from 'lucide-react';
import { BG, TEXT, NOBLE } from '../theme/colors';
import SectionHeader from '../sentinel-components/SectionHeader';

interface CampusBudgetDetailProps {
  campusName: string;
}

export default function CampusBudgetDetail({ campusName }: CampusBudgetDetailProps) {
  return (
    <div>
      <SectionHeader
        title="Budget Detail"
        subtitle={`${campusName} departmental spending breakdown`}
      />

      <div style={{
        background: BG.card,
        border: `1px solid ${BG.border}`,
        borderRadius: 12,
        padding: '60px 40px',
        textAlign: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <FileText size={48} color={NOBLE.navy} strokeWidth={1.5} style={{ marginBottom: 16, opacity: 0.4 }} />
        <div style={{
          fontSize: 16,
          fontWeight: 500,
          color: TEXT.primary,
          fontFamily: "'DM Sans', sans-serif",
          marginBottom: 8,
        }}>
          Detailed campus budget data coming soon.
        </div>
        <div style={{
          fontSize: 14,
          color: TEXT.muted,
          fontFamily: "'Inter', sans-serif",
          lineHeight: 1.5,
        }}>
          Contact Finance for your campus P&L.
        </div>
      </div>
    </div>
  );
}
