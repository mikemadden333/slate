/**
 * ProtocolModal — 7-step emergency protocol execution.
 * PA script, family notification (AI-generated), leadership notification, documentation.
 *
 * CRITICAL: Code White PA script MUST NOT mention ICE, immigration, or law enforcement.
 * Code White family message AI prompt contains explicit ICE prohibition.
 */

import { useState, useCallback } from 'react';
import { EMERGENCY_CODES } from '../../sentinel-data/codes';
import type { CampusRisk } from '../../sentinel-engine/types';
import type { Campus } from '../../sentinel-data/campuses';
import { X, Copy, Check, MessageSquare } from 'lucide-react';

interface Props {
  code: string;
  campus: Campus;
  risk: CampusRisk;
  onClose: () => void;
}

export default function ProtocolModal({ code, campus, risk, onClose }: Props) {
  const ec = EMERGENCY_CODES.find(c => c.code === code);
  if (!ec) return null;

  const [checkedSteps, setCheckedSteps] = useState<boolean[]>(
    new Array(ec.steps.length).fill(false),
  );
  const [familyMessage, setFamilyMessage] = useState('');
  const [generatingMsg, setGeneratingMsg] = useState(false);
  const [copiedPA, setCopiedPA] = useState(false);
  const [copiedFamily, setCopiedFamily] = useState(false);

  const toggleStep = (idx: number) => {
    setCheckedSteps(prev => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

  const copyToClipboard = useCallback(async (text: string, setCopied: (v: boolean) => void) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const generateFamilyMessage = useCallback(async () => {
    setGeneratingMsg(true);

    // AI-generated family message
    const isWhite = code === 'WHITE';
    const prompt = isWhite
      ? `Write a brief parent notification for ${campus.name}.
We are implementing a safety protocol — Code White / Neptune.
ABSOLUTE REQUIREMENT: Do NOT mention ICE, immigration, immigration enforcement, federal agents, law enforcement, raids, deportation, undocumented, or the nature of this threat.
This is a legal requirement to protect student and family safety.
Parents may include undocumented individuals who could be harmed if the nature of the threat is identified in a message.
Write: calm, brief, reassuring. 3 sentences max.
Start with: 'Dear Noble Families,'
Mention: students are safe inside the building.
Mention: normal dismissal may be modified — await notification.
DO NOT mention: any details about what is happening outside.
DO NOT mention: law enforcement of any kind.
DO NOT mention: immigration.
DO NOT mention: the reason for the protocol.`
      : `Write a brief parent notification for ${campus.name}.
We are implementing ${ec.name}.
Write: calm, brief, reassuring. 3 sentences max.
Start with: 'Dear Noble Families,'
Mention: students are safe.
Mention: staff are following safety procedures.
Mention: further updates will follow.
Context: Risk score ${risk.score} (${risk.label}).`;

    try {
      const res = await fetch('/api/anthropic-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 200,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!res.ok) throw new Error(`API: ${res.status}`);
      const data = await res.json() as { content: Array<{ text: string }> };
      setFamilyMessage(data.content[0]?.text ?? '');
    } catch {
      setFamilyMessage(
        `Dear Noble Families,\n\nWe are implementing a safety protocol at ${campus.name}. ` +
        `All students are safe inside the building. Please await further communication.`,
      );
    } finally {
      setGeneratingMsg(false);
    }
  }, [code, campus, ec, risk]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      zIndex: 5000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        maxWidth: 600,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{
          background: ec.color,
          color: '#fff',
          padding: '16px 20px',
          borderRadius: '16px 16px 0 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: 1 }}>
              {ec.name}
            </div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>
              {campus.name} — {new Date().toLocaleTimeString()}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              cursor: 'pointer',
              padding: 6,
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          {/* PA Script */}
          <div style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#0D1117',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span>PA Script</span>
              <button
                onClick={() => copyToClipboard(ec.paScript, setCopiedPA)}
                style={{
                  background: copiedPA ? '#16A34A' : '#F3F4F6',
                  border: 'none',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 11,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  color: copiedPA ? '#fff' : '#374151',
                }}
              >
                {copiedPA ? <Check size={12} /> : <Copy size={12} />}
                {copiedPA ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div style={{
              background: ec.bgColor,
              border: `1px solid ${ec.color}33`,
              borderRadius: 8,
              padding: 12,
              fontSize: 13,
              lineHeight: 1.6,
              color: '#374151',
              fontStyle: 'italic',
            }}>
              {ec.paScript}
            </div>
          </div>

          {/* Protocol steps */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1117', marginBottom: 8 }}>
              Protocol Steps ({checkedSteps.filter(Boolean).length}/{ec.steps.length})
            </div>
            {ec.steps.map((step, idx) => (
              <div
                key={idx}
                onClick={() => toggleStep(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '8px 0',
                  borderBottom: '1px solid #F3F4F6',
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  border: `2px solid ${checkedSteps[idx] ? '#16A34A' : '#D1D5DB'}`,
                  background: checkedSteps[idx] ? '#16A34A' : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 1,
                }}>
                  {checkedSteps[idx] && <Check size={12} color="#fff" />}
                </div>
                <span style={{
                  fontSize: 13,
                  color: checkedSteps[idx] ? '#9CA3AF' : '#374151',
                  textDecoration: checkedSteps[idx] ? 'line-through' : 'none',
                  lineHeight: 1.4,
                }}>
                  {idx + 1}. {step}
                </span>
              </div>
            ))}
          </div>

          {/* Family notification */}
          <div style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#0D1117',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span>Family Notification</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={generateFamilyMessage}
                  disabled={generatingMsg}
                  style={{
                    background: '#0D1117',
                    border: 'none',
                    borderRadius: 6,
                    padding: '4px 10px',
                    fontSize: 11,
                    cursor: generatingMsg ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    color: '#fff',
                  }}
                >
                  <MessageSquare size={12} />
                  {generatingMsg ? 'Generating...' : 'Generate'}
                </button>
                {familyMessage && (
                  <button
                    onClick={() => copyToClipboard(familyMessage, setCopiedFamily)}
                    style={{
                      background: copiedFamily ? '#16A34A' : '#F3F4F6',
                      border: 'none',
                      borderRadius: 6,
                      padding: '4px 10px',
                      fontSize: 11,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      color: copiedFamily ? '#fff' : '#374151',
                    }}
                  >
                    {copiedFamily ? <Check size={12} /> : <Copy size={12} />}
                    {copiedFamily ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>
            </div>
            {familyMessage && (
              <div style={{
                background: '#F8F9FA',
                border: '1px solid #E5E7EB',
                borderRadius: 8,
                padding: 12,
                fontSize: 13,
                lineHeight: 1.6,
                color: '#374151',
                whiteSpace: 'pre-wrap',
              }}>
                {familyMessage}
              </div>
            )}
          </div>

          {/* Noble leadership notification data */}
          <div style={{
            background: '#F8F9FA',
            border: '1px solid #E5E7EB',
            borderRadius: 8,
            padding: 12,
            fontSize: 12,
            color: '#6B7280',
          }}>
            <div style={{ fontWeight: 700, color: '#374151', marginBottom: 4 }}>
              Noble Leadership Notification Data
            </div>
            <div>Campus: {campus.name}</div>
            <div>Code: {ec.name}</div>
            <div>Initiated: {new Date().toLocaleString()}</div>
            <div>Risk Score: {risk.score} ({risk.label})</div>
            <div>Contagion Zones: {risk.contagionZones.length} ({risk.inRetaliationWindow ? 'RETALIATION WINDOW ACTIVE' : 'No retaliation window'})</div>
            <div>Steps Completed: {checkedSteps.filter(Boolean).length}/{ec.steps.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
