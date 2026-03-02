import { NOBLE, TEXT } from '../theme/colors';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

export default function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <div style={{
      paddingBottom: 12,
      borderBottom: `2px solid ${NOBLE.navy}`,
      borderImage: `linear-gradient(to right, ${NOBLE.navy}, ${NOBLE.gold}) 1`,
      marginBottom: 20,
    }}>
      <h2 style={{
        fontSize: 20,
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 700,
        color: TEXT.primary,
        margin: 0,
      }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{
          fontSize: 14,
          color: TEXT.muted,
          margin: '4px 0 0',
        }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
