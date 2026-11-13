import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { apiRequest } from '../lib/api.js';
import { Badge } from '../components/ui/Badge.js';
import { Button } from '../components/ui/Button.js';
import { Banner } from '../components/ui/Banner.js';
import { DefinitionList } from '../components/ui/DefinitionList.js';
import { MoneyCell } from '../components/ui/MoneyCell.js';

export const Dashboard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        await refreshUser();
        const accs = await apiRequest('/accounts');
        setAccounts(accs);

        if (accs && accs.length > 0) {
          // Fetch ledger for primary account
          const primary = accs[0];
          const ledger = await apiRequest(`/accounts/${primary.id}/ledger`);
          setRecentEntries(ledger.slice(0, 10));
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const primaryAccount = accounts[0];
  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.cachedBalance || 0), 0);
  const onboardingStatus = user?.onboarding?.status || 'DRAFT';

  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date());

  if (loading) {
    return (
      <div className="space-y-4 text-left">
        <div className="h-8 w-48 bg-paper-sunk rounded-[2px] animate-pulse" />
        <div className="h-44 w-full bg-paper-sunk rounded-[2px] animate-pulse" />
        <div className="h-64 w-full bg-paper-sunk rounded-[2px] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-rule">
        <div>
          <h1 className="font-serif text-[32px] leading-[38px] font-medium text-ink flex items-center gap-3">
            <span>Account</span>
            {primaryAccount ? (
              <span className="font-mono text-2xl text-ink font-semibold">
                {primaryAccount.accountNumber}
              </span>
            ) : (
              <span className="font-mono text-xl text-ink-soft">PENDING</span>
            )}
            <Badge variant={primaryAccount?.status === 'ACTIVE' ? 'green' : 'brass'}>
              {primaryAccount?.status || onboardingStatus}
            </Badge>
          </h1>
          <p className="text-[13px] text-ink-soft mt-1">
            Holder: {user?.fullName} • Single entity double-entry ledger statement
          </p>
        </div>

        {primaryAccount && (
          <div className="flex items-center gap-3">
            <Link to="/accounts">
              <Button variant="secondary">Manage Movements</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Onboarding State Notices */}
      {onboardingStatus === 'DRAFT' && (
        <Banner
          type="warning"
          title="Onboarding Incomplete"
          message={
            <div>
              Verification details are required before account activation and ledger operations can commence.{' '}
              <Link to="/onboarding" className="font-semibold underline ml-1">
                Complete Onboarding →
              </Link>
            </div>
          }
        />
      )}

      {onboardingStatus === 'SUBMITTED' && (
        <Banner
          type="info"
          title="Verification Pending Review"
          message="Your application has been submitted and is currently queued for administrator approval. Initial clearing accounts will be provisioned upon confirmation."
        />
      )}

      {onboardingStatus === 'REJECTED' && (
        <Banner
          type="error"
          title="Application Needs Revision"
          message={
            <div>
              Review notes: "{user?.onboarding?.reviewNotes || 'Please update your details and re-submit.'}"{' '}
              <Link to="/onboarding" className="font-semibold underline ml-1">
                Edit & Resubmit Application →
              </Link>
            </div>
          }
        />
      )}

      {/* Single Large Balance Statement (PRD §7.3) */}
      <div className="bg-paper-raised border border-rule rounded-[2px] p-6 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left: 40px mono balance figure + action buttons */}
        <div className="md:col-span-7 space-y-4">
          <div className="text-[11.5px] font-mono uppercase tracking-[0.06em] text-ink-soft font-semibold select-none">
            AVAILABLE BALANCE
          </div>

          <div className="font-mono text-[40px] leading-[44px] font-medium text-ink tabular-nums">
            <MoneyCell
              amount={totalBalance}
              isCents={true}
              direction="BALANCE"
              showSign={false}
              className="text-[40px] font-medium"
            />
          </div>

          <div className="text-[13px] text-ink-soft font-sans">
            As of {formattedDate}
          </div>

          {/* Primary Action Buttons placed directly below balance, left-aligned, not floating */}
          {primaryAccount && (
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link to="/accounts">
                <Button variant="primary">Deposit Funds</Button>
              </Link>
              <Link to="/accounts">
                <Button variant="secondary">Withdraw Funds</Button>
              </Link>
              <Link
                to={`/accounts/${primaryAccount.id}/ledger`}
                className="text-xs font-sans font-medium text-green hover:underline ml-2"
              >
                View full statement →
              </Link>
            </div>
          )}
        </div>

        {/* Right: Dotted statement definition list (§7.3) */}
        <div className="md:col-span-5 border-t md:border-t-0 md:border-l border-rule pt-6 md:pt-0 md:pl-8">
          <div className="text-[11.5px] font-mono uppercase tracking-[0.06em] text-ink-soft font-semibold mb-3 select-none">
            Statement Details
          </div>
          <DefinitionList
            items={[
              {
                label: 'Account Type',
                value: primaryAccount?.accountType || 'Standard Holder',
              },
              {
                label: 'Currency',
                value: primaryAccount?.currency || 'USD',
                isMono: true,
              },
              {
                label: 'Account Identifier',
                value: primaryAccount?.accountNumber || '—',
                isMono: true,
              },
              {
                label: 'Total Entries',
                value: recentEntries.length,
                isMono: true,
              },
              {
                label: 'Ledger Invariant',
                value: 'Σ(Debits) = Σ(Credits)',
                isMono: true,
              },
            ]}
          />
        </div>
      </div>

      {/* Recent Entries Ledger Table (PRD §7.3) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-[22px] leading-7 font-medium text-ink">
            Recent Entries
          </h2>
          {primaryAccount && (
            <Link
              to={`/accounts/${primaryAccount.id}/ledger`}
              className="text-xs font-sans font-semibold text-green hover:underline"
            >
              View full ledger →
            </Link>
          )}
        </div>

        {/* Table sitting directly on page with 2px strong top border and 1px bottom border per spec §6 */}
        <div className="w-full overflow-x-auto border-t-2 border-t-rule-strong border-b border-b-rule">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-paper-sunk border-b border-rule">
                <th
                  scope="col"
                  className="py-2.5 px-4 text-[11.5px] font-mono uppercase tracking-[0.06em] font-semibold text-ink-soft select-none"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="py-2.5 px-4 text-[11.5px] font-mono uppercase tracking-[0.06em] font-semibold text-ink-soft select-none"
                >
                  Reference
                </th>
                <th
                  scope="col"
                  className="py-2.5 px-4 text-[11.5px] font-mono uppercase tracking-[0.06em] font-semibold text-ink-soft select-none"
                >
                  Description
                </th>
                <th
                  scope="col"
                  className="py-2.5 px-4 text-[11.5px] font-mono uppercase tracking-[0.06em] font-semibold text-ink-soft text-right select-none"
                >
                  Debit (Out)
                </th>
                <th
                  scope="col"
                  className="py-2.5 px-4 text-[11.5px] font-mono uppercase tracking-[0.06em] font-semibold text-ink-soft text-right select-none"
                >
                  Credit (In)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule text-[14px]">
              {recentEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-ink-soft">
                    <p className="font-serif text-base text-ink mb-1">
                      No entries recorded yet.
                    </p>
                    <p className="text-xs text-ink-faint">
                      Entries appear here once the account moves funds.
                    </p>
                  </td>
                </tr>
              ) : (
                recentEntries.map((entry) => {
                  const isDebit = entry.direction === 'DEBIT';
                  const isCredit = entry.direction === 'CREDIT';
                  return (
                    <tr
                      key={entry.id}
                      className="h-11 hover:bg-paper-sunk/60 transition-colors"
                    >
                      <td className="py-2.5 px-4 font-mono text-xs text-ink-soft whitespace-nowrap">
                        {new Date(entry.createdAt).toISOString().replace('T', ' ').substring(0, 16)}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-xs font-semibold text-ink">
                        {entry.transaction?.reference || '—'}
                      </td>
                      <td className="py-2.5 px-4 text-ink truncate max-w-[280px]">
                        {entry.transaction?.description || 'Account Movement'}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {isDebit ? (
                          <MoneyCell
                            amount={entry.amount}
                            isCents={true}
                            direction="DEBIT"
                          />
                        ) : (
                          <span className="text-ink-faint font-mono text-xs">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {isCredit ? (
                          <MoneyCell
                            amount={entry.amount}
                            isCents={true}
                            direction="CREDIT"
                          />
                        ) : (
                          <span className="text-ink-faint font-mono text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
