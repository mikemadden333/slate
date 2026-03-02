/**
 * NewsView — 4-tier news intelligence feed.
 * Items sorted by tier priority: Campus Proximate > Chicago Violence > Chicago General > National.
 * Section dividers between tiers. Within each tier, sorted by recency.
 */

import { useMemo } from 'react';
import type { NewsItem, NewsTier } from '../../sentinel-engine/types';
import { fmtAgo } from '../../sentinel-engine/geo';
import { Newspaper, ExternalLink } from 'lucide-react';
import { CAMPUSES } from '../../sentinel-data/campuses';

interface Props {
  newsItems: NewsItem[];
  campusName?: string;
}

const TIER_ORDER: Record<NewsTier, number> = {
  CAMPUS_PROXIMATE: 0,
  CHICAGO_VIOLENCE: 1,
  CHICAGO_GENERAL: 2,
  NATIONAL_BREAKING: 3,
};

const TIER_SECTION_LABELS: Record<NewsTier, string> = {
  CAMPUS_PROXIMATE: 'NEAR YOUR CAMPUS',
  CHICAGO_VIOLENCE: 'CHICAGO VIOLENCE',
  CHICAGO_GENERAL: 'CHICAGO NEWS',
  NATIONAL_BREAKING: 'NATIONAL',
};

const TIER_STYLE: Record<NewsTier, { borderColor: string; badge: string; badgeBg: string }> = {
  CAMPUS_PROXIMATE:  { borderColor: '#DC2626', badge: 'NEAR CAMPUS',       badgeBg: '#DC2626' },
  CHICAGO_VIOLENCE:  { borderColor: '#EA580C', badge: 'CHICAGO VIOLENCE',  badgeBg: '#EA580C' },
  CHICAGO_GENERAL:   { borderColor: '#3B82F6', badge: 'CHICAGO',           badgeBg: '#3B82F6' },
  NATIONAL_BREAKING: { borderColor: '#1B3A6B', badge: 'NATIONAL',          badgeBg: '#1B3A6B' },
};

const TIER_KEYS: NewsTier[] = ['CAMPUS_PROXIMATE', 'CHICAGO_VIOLENCE', 'CHICAGO_GENERAL', 'NATIONAL_BREAKING'];

export default function NewsView({ newsItems, campusName }: Props) {
  // Sort by tier priority, then recency within tier
  const sorted = useMemo(() => {
    return [...newsItems].sort((a, b) => {
      const tierDiff = TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
      if (tierDiff !== 0) return tierDiff;
      return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    });
  }, [newsItems]);

  // Group items by tier
  const grouped = useMemo(() => {
    const groups: Record<NewsTier, NewsItem[]> = {
      CAMPUS_PROXIMATE: [],
      CHICAGO_VIOLENCE: [],
      CHICAGO_GENERAL: [],
      NATIONAL_BREAKING: [],
    };
    for (const item of sorted) {
      groups[item.tier].push(item);
    }
    return groups;
  }, [sorted]);

  const totalCount = newsItems.length;
  const sourceCount = useMemo(() => new Set(newsItems.map(n => n.source)).size, [newsItems]);

  return (
    <div style={{
      border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, marginBottom: 16,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12, flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          color: '#1B3A6B', fontWeight: 700, fontSize: 15,
          paddingLeft: 10, borderLeft: '3px solid #F0B429',
        }}>
          <Newspaper size={18} />
          News Intelligence
        </div>
        <div style={{ fontSize: 12, color: '#6B7280' }}>
          {totalCount} items from {sourceCount} sources
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 600, overflowY: 'auto' }}>
        {totalCount === 0 && (
          <div style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: 20 }}>
            No news items available. Monitoring active.
          </div>
        )}

        {TIER_KEYS.map(tier => {
          const items = grouped[tier];

          // For tier 1, show special empty message
          if (tier === 'CAMPUS_PROXIMATE' && items.length === 0) {
            return (
              <div key={tier}>
                <TierDivider label={TIER_SECTION_LABELS[tier]} count={0} />
                <div style={{
                  fontSize: 13, color: '#9CA3AF', padding: '12px 16px',
                  fontStyle: 'italic', lineHeight: 1.5,
                }}>
                  No violence news near {campusName ?? 'your campus'} in the last 6 hours.
                  Monitoring Block Club Chicago and {Math.max(0, sourceCount - 1)} other sources.
                </div>
              </div>
            );
          }

          // Skip empty tiers (except tier 1 handled above)
          if (items.length === 0) return null;

          return (
            <div key={tier}>
              <TierDivider label={TIER_SECTION_LABELS[tier]} count={items.length} />
              {items.map(item => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TierDivider({ label, count }: { label: string; count: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '12px 0 6px', marginTop: 4,
    }}>
      <span style={{
        fontSize: 11, fontWeight: 700, color: '#9CA3AF',
        letterSpacing: 1.5, whiteSpace: 'nowrap',
        textTransform: 'uppercase',
      }}>
        {label} ({count})
      </span>
      <div style={{
        flex: 1, height: 1, background: '#E5E7EB',
      }} />
    </div>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  const style = TIER_STYLE[item.tier];
  const campusName = item.proximateCampusIds && item.proximateCampusIds.length > 0
    ? CAMPUSES.find(c => c.id === item.proximateCampusIds![0])?.short
    : null;

  return (
    <div style={{
      padding: '10px 12px', borderRadius: 6, marginBottom: 4,
      borderLeft: `3px solid ${style.borderColor}`,
      background: '#F8F9FA',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{
              fontSize: 9, fontWeight: 800, color: '#fff',
              background: style.badgeBg, padding: '2px 6px', borderRadius: 3,
            }}>
              {campusName ? `NEAR ${campusName.toUpperCase()}` : style.badge}
            </span>
            {item.isBreaking && (
              <span style={{
                fontSize: 9, fontWeight: 800, color: '#fff',
                background: '#DC2626', padding: '2px 6px', borderRadius: 3,
              }}>
                BREAKING
              </span>
            )}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', lineHeight: 1.3 }}>
            {item.title}
          </div>
          {item.description && (
            <div style={{
              fontSize: 12, color: '#6B7280', marginTop: 4, lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {item.description}
            </div>
          )}
        </div>
        {item.link && (
          <a href={item.link} target="_blank" rel="noopener noreferrer"
            style={{ color: '#6B7280', flexShrink: 0 }}>
            <ExternalLink size={14} />
          </a>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: 10, color: '#9CA3AF' }}>
        <span>{item.source}</span>
        <span>{fmtAgo(item.pubDate)}</span>
        {item.neighborhoods.length > 0 && (
          <span style={{ color: '#6B7280' }}>{item.neighborhoods.join(', ')}</span>
        )}
      </div>
    </div>
  );
}
