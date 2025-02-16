/* eslint-disable react/jsx-props-no-spreading */

import { formatDistanceToNowStrict } from 'date-fns';
import { MotionProps, motion } from 'framer-motion';
import { PropsWithChildren, useEffect, useReducer } from 'react';
import { Address } from 'wagmi';

import { i18n } from '~/core/languages';
import { useCurrentAddressStore } from '~/core/state';
import { useCurrentThemeStore } from '~/core/state/currentSettings/currentTheme';
import { truncateAddress } from '~/core/utils/address';
import { copy } from '~/core/utils/copy';
import { formatDate } from '~/core/utils/formatDate';
import { createNumberFormatter } from '~/core/utils/formatNumber';
import {
  Box,
  Inline,
  Separator,
  Stack,
  Symbol,
  Text,
  TextOverflow,
} from '~/design-system';
import { BoxProps } from '~/design-system/components/Box/Box';
import { Skeleton } from '~/design-system/components/Skeleton/Skeleton';
import { linearGradients } from '~/design-system/styles/designTokens';
import { AddressOrEns } from '~/entries/popup/components/AddressOrEns/AddressorEns';
import { WalletAvatar } from '~/entries/popup/components/WalletAvatar/WalletAvatar';

import { usePoints } from './usePoints';

const { format: formatNumber } = createNumberFormatter({
  maximumSignificantDigits: 8,
});

function Card({
  children,
  ...props
}: PropsWithChildren<BoxProps & MotionProps>) {
  return (
    <Box
      as={motion.div}
      initial={{ scale: 0.98, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      display="flex"
      flexDirection="column"
      justifyContent="center"
      gap="12px"
      paddingVertical="16px"
      paddingHorizontal="18px"
      borderRadius="16px"
      background="surfaceSecondaryElevated"
      width="full"
      boxShadow="12px surfaceSecondaryElevated"
      {...props}
    >
      {children}
    </Box>
  );
}

const LeaderboardPositionNumberDisplay = ({
  position,
  children,
}: PropsWithChildren<{ position: number }>) => {
  const medal = (['🥇', '🥈', '🥉'] as const)[position - 1];

  if (medal)
    return (
      <Inline wrap={false} space="8px" alignVertical="center">
        <Text
          size="12pt"
          weight="bold"
          webkitBackgroundClip="text"
          background={medal}
          color="transparent"
        >
          {children}
        </Text>
        <Text size="16pt" weight="bold">
          {medal}
        </Text>
      </Inline>
    );

  return (
    <Inline wrap={false} space="8px" alignVertical="center">
      <Text size="12pt" weight="bold" color="labelTertiary">
        {children}
      </Text>
      <Text size="10pt" weight="bold" color="labelTertiary">
        #{position}
      </Text>
    </Inline>
  );
};

function Leaderboard() {
  const { currentAddress } = useCurrentAddressStore();
  const { data, isSuccess } = usePoints(currentAddress);
  if (!data || !isSuccess) return null;

  const { user, leaderboard } = data;

  return (
    <Stack gap="16px">
      <Text size="16pt" weight="bold">
        {i18n.t('points.leaderboard')}
      </Text>

      <Card
        paddingVertical="12px"
        paddingHorizontal="16px"
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
      >
        <Inline wrap={false} space="12px" alignVertical="center">
          <WalletAvatar
            size={32}
            addressOrName={currentAddress}
            emojiSize="16pt"
          />
          <AddressOrEns address={currentAddress} size="14pt" weight="bold" />
        </Inline>
        {user.stats.position.unranked ? (
          <Text size="16pt" weight="bold" color="labelQuaternary">
            {i18n.t('points.unranked')}
          </Text>
        ) : (
          <Text
            size="16pt"
            weight="bold"
            color="accent"
            textShadow="12px accent"
          >
            #{formatNumber(user.stats.position.current)}
          </Text>
        )}
      </Card>
      <Card paddingVertical="10px" paddingHorizontal="16px">
        <Stack separator={<Separator color="separatorTertiary" />} space="12px">
          {leaderboard.accounts
            ?.slice(0, 100)
            .map(({ address, earnings, ens, avatarURL }, index) => (
              <Inline
                key={address}
                wrap={false}
                space="12px"
                alignVertical="center"
                alignHorizontal="justify"
              >
                <Inline wrap={false} space="12px" alignVertical="center">
                  <WalletAvatar
                    size={32}
                    avatarUrl={avatarURL}
                    addressOrName={address}
                    emojiSize="16pt"
                  />
                  <TextOverflow size="14pt" weight="bold">
                    {ens || truncateAddress(address as Address)}
                  </TextOverflow>
                </Inline>
                <LeaderboardPositionNumberDisplay position={index + 1}>
                  {formatNumber(earnings.total)}
                </LeaderboardPositionNumberDisplay>
              </Inline>
            ))}
        </Stack>
      </Card>
    </Stack>
  );
}

function TextWithMoreInfo({ children }: PropsWithChildren) {
  return (
    <Inline wrap={false} space="4px" alignVertical="center">
      <Text size="14pt" weight="semibold" color="labelSecondary">
        {children}
      </Text>
      {/* commented for now, we'll add in the future */}
      {/* <Symbol
        weight="bold"
        symbol="info.circle.fill"
        color="labelQuaternary"
        size={12}
      /> */}
    </Inline>
  );
}

export const copyReferralLink = (referralCode: string) =>
  copy({
    value: `https://rainbow.me/points?ref=${referralCode}`,
    title: i18n.t('points.copied_referral_link'),
    description: `rainbow.me/points?ref=${referralCode}`,
  });

const formatReferralCode = (referralCode: string) =>
  referralCode.slice(0, 3) + '-' + referralCode.slice(-3);
function ReferralCode() {
  const { currentAddress } = useCurrentAddressStore();
  const { data, isSuccess } = usePoints(currentAddress);

  return (
    <Stack gap="12px">
      <TextWithMoreInfo>{i18n.t('points.referral_code')}</TextWithMoreInfo>

      <Inline wrap={false} space="12px">
        {data && isSuccess ? (
          <>
            <Card
              paddingVertical="12px"
              whileTap={{ scale: 0.98 }}
              whileFocus={{ scale: 1.02 }}
              whileHover={{ scale: 1.02 }}
              onTap={() =>
                copy({
                  value: data.user.referralCode,
                  title: i18n.t('points.copied_referral_code'),
                  description: formatReferralCode(data.user.referralCode),
                })
              }
            >
              <Text size="20pt" weight="bold" align="center">
                {formatReferralCode(data.user.referralCode)}
              </Text>
            </Card>

            <Card
              paddingVertical="12px"
              flexDirection="row"
              alignItems="center"
              whileTap={{ scale: 0.98 }}
              whileFocus={{ scale: 1.02 }}
              whileHover={{ scale: 1.02 }}
              onTap={() => copyReferralLink(data.user.referralCode)}
            >
              <Symbol
                symbol="square.on.square"
                color="accent"
                filter="shadow 12px accent"
                weight="bold"
                size={16}
              />
              <Text
                size="16pt"
                weight="bold"
                color="accent"
                textShadow="12px accent"
                align="center"
              >
                {i18n.t('copy_link')}
              </Text>
            </Card>
          </>
        ) : (
          <>
            <CardSkeleton height="40px" />
            <CardSkeleton height="40px" />
          </>
        )}
      </Inline>

      <Text size="12pt" weight="medium" color="labelQuaternary">
        {i18n.t('points.referral_code_description')}
      </Text>
    </Stack>
  );
}

function CardSkeleton({ height }: { height: string }) {
  return <Skeleton height={height} width="100%" style={{ borderRadius: 16 }} />;
}

function NextDistributionIn({ nextDistribution }: { nextDistribution: Date }) {
  const [nextDistributionIn, recalcNextDistributionDistance] = useReducer(
    () => formatDistanceToNowStrict(nextDistribution),
    formatDistanceToNowStrict(nextDistribution),
  );

  useEffect(() => {
    const interval = setInterval(recalcNextDistributionDistance, 1000);
    return () => clearInterval(interval);
  }, [nextDistribution]);

  return (
    <Text size="20pt" weight="bold">
      {nextDistributionIn}
    </Text>
  );
}

function YourRankAndNextDrop() {
  const { currentAddress } = useCurrentAddressStore();
  const { data, isSuccess } = usePoints(currentAddress);

  if (!data || !isSuccess)
    return (
      <Inline wrap={false} space="12px">
        <CardSkeleton height="89px" />
        <CardSkeleton height="89px" />
      </Inline>
    );

  const { meta, leaderboard, user } = data;

  const nextDistribution = new Date(meta.distribution.next * 1000);

  return (
    <Inline wrap={false} space="12px">
      <Card>
        <TextWithMoreInfo>{i18n.t('points.next_drop')}</TextWithMoreInfo>

        <NextDistributionIn nextDistribution={nextDistribution} />
        <Inline alignVertical="center" space="4px" wrap={false}>
          <Symbol
            size={12}
            symbol="calendar"
            weight="bold"
            color="accent"
            filter="shadow 12px accent"
          />
          <Text
            size="10pt"
            weight="bold"
            color="accent"
            textShadow="12px accent"
          >
            {formatDate(nextDistribution)}
          </Text>
        </Inline>
      </Card>

      <Card>
        <TextWithMoreInfo>{i18n.t('points.your_rank')}</TextWithMoreInfo>
        {user.stats.position.unranked ? (
          <>
            <TextOverflow size="20pt" weight="bold" color="labelTertiary">
              {i18n.t('points.unranked')}
            </TextOverflow>
            <TextOverflow
              size="10pt"
              weight="bold"
              color="accent"
              textShadow="12px accent"
            >
              {i18n.t('points.points_to_rank', {
                rank_cutoff: leaderboard.stats.rank_cutoff,
              })}
            </TextOverflow>
          </>
        ) : (
          <>
            <TextOverflow size="20pt" weight="bold">
              #{formatNumber(user.stats.position.current)}
            </TextOverflow>
            <Inline alignVertical="center" space="4px" wrap={false}>
              <Symbol
                size={12}
                symbol="person.2.fill"
                weight="bold"
                color="accent"
                filter="shadow 12px accent"
              />
              <Text
                size="10pt"
                weight="bold"
                color="accent"
                textShadow="12px accent"
              >
                {i18n.t('points.out_of', {
                  total: formatNumber(leaderboard.stats.total_users),
                })}
              </Text>
            </Inline>
          </>
        )}
      </Card>
    </Inline>
  );
}

const mapToRange = (
  num: number,
  inputRange = [0, 3_000_000],
  outputRange = [30, 300],
) => {
  const [inMin, inMax] = inputRange;
  const [outMin, outMax] = outputRange;
  const result = ((num - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  return result > outMax ? outMax : result;
};

function YourPoints() {
  const { currentAddress } = useCurrentAddressStore();
  const { data, isSuccess } = usePoints(currentAddress);

  if (!data || !isSuccess)
    return (
      <Stack space="12px">
        <Skeleton height="18px" width="90px" />
        <Skeleton height="10px" width="40px" />
        <Skeleton height="9px" width="200px" />
      </Stack>
    );

  const { leaderboard, user } = data;

  return (
    <Box
      as={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      display="flex"
      flexDirection="column"
      gap="12px"
    >
      <Text size="26pt" weight="heavy">
        {formatNumber(user.earnings.total)}
      </Text>
      <Box
        as={motion.div}
        borderRadius="round"
        initial={{ width: 40 }}
        transition={{ duration: 1 }}
        animate={{
          width: mapToRange(user.earnings.total, [0, 2_000_000], [40, 300]),
        }}
        style={{ height: 10, background: linearGradients.points }}
      />
      <Text
        size="12pt"
        weight="bold"
        background="points"
        color="transparent"
        webkitBackgroundClip="text"
      >
        {i18n.t('points.out_of_current_total_points', {
          total: formatNumber(leaderboard.stats.total_points),
        })}
      </Text>
    </Box>
  );
}

export function PointsDashboard() {
  const { currentTheme } = useCurrentThemeStore();
  return (
    <Stack
      gap="20px"
      separator={<Separator color="separatorTertiary" />}
      width="full"
      marginTop="-20px" // there is a 20px top inset wrapping all tabs, I don't wanna mess with that rn afraid of breaking something somewhere else
      padding="20px"
      background={currentTheme === 'light' ? 'surfaceSecondary' : undefined}
    >
      <YourPoints />
      <YourRankAndNextDrop />
      <ReferralCode />
      <Leaderboard />
    </Stack>
  );
}
