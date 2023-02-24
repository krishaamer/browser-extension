import React, { ReactNode, useMemo } from 'react';

import { supportedCurrencies } from '~/core/references';
import { useCurrentCurrencyStore } from '~/core/state';
import { useCurrentThemeStore } from '~/core/state/currentSettings/currentTheme';
import { useHideAssetBalancesStore } from '~/core/state/currentSettings/hideAssetBalances';
import { UniqueId } from '~/core/types/assets';
import {
  Box,
  Column,
  Columns,
  Inline,
  Inset,
  Row,
  Rows,
  TextOverflow,
} from '~/design-system';
import { rowTransparentAccentHighlight } from '~/design-system/styles/rowTransparentAccentHighlight.css';
import { Asterisks } from '~/entries/popup/components/Asterisks/Asterisks';
import { CoinIcon } from '~/entries/popup/components/CoinIcon/CoinIcon';
import { useUserAsset } from '~/entries/popup/hooks/useUserAsset';

import {
  swapTokenInputHighlightWrapperStyleDark,
  swapTokenInputHighlightWrapperStyleLight,
} from '../SwapTokenInput.css';

const { innerWidth: windowWidth } = window;
const TEXT_MAX_WIDTH = windowWidth - 210;
const BALANCE_TEXT_MAX_WIDTH = 75;

const RowHighlightWrapper = ({ children }: { children: ReactNode }) => {
  const { currentTheme } = useCurrentThemeStore();
  return (
    <Inset>
      <Box
        borderRadius="12px"
        className={
          currentTheme === 'dark'
            ? swapTokenInputHighlightWrapperStyleDark
            : swapTokenInputHighlightWrapperStyleLight
        }
      >
        {children}
      </Box>
    </Inset>
  );
};

type AssetRowProps = {
  uniqueId: UniqueId;
};

export function SwapTokenRow({ uniqueId }: AssetRowProps) {
  const asset = useUserAsset(uniqueId);
  const name = asset?.name;
  const { hideAssetBalances } = useHideAssetBalancesStore();
  const { currentCurrency } = useCurrentCurrencyStore();

  const balanceDisplay = useMemo(
    () => (
      <TextOverflow
        maxWidth={TEXT_MAX_WIDTH}
        color="labelTertiary"
        size="12pt"
        weight="semibold"
      >
        {asset?.balance?.display}
      </TextOverflow>
    ),
    [asset?.balance?.display],
  );

  const nativeBalanceDisplay = useMemo(
    () =>
      hideAssetBalances ? (
        <Inline alignHorizontal="right">
          <TextOverflow
            maxWidth={TEXT_MAX_WIDTH}
            size="14pt"
            weight="semibold"
            align="right"
          >
            {supportedCurrencies[currentCurrency].symbol}
          </TextOverflow>
          <Asterisks color="label" size={10} />
        </Inline>
      ) : (
        <TextOverflow
          maxWidth={BALANCE_TEXT_MAX_WIDTH}
          size="14pt"
          weight="semibold"
          align="right"
        >
          {asset?.native?.balance?.display}
        </TextOverflow>
      ),
    [asset?.native?.balance?.display, hideAssetBalances, currentCurrency],
  );

  const leftColumn = useMemo(
    () => (
      <Rows>
        <Row>
          <Box paddingVertical="4px">
            <TextOverflow
              maxWidth={TEXT_MAX_WIDTH}
              size="14pt"
              weight="semibold"
            >
              {name}
            </TextOverflow>
          </Box>
        </Row>
        <Row>
          <Box paddingVertical="4px">{balanceDisplay}</Box>
        </Row>
      </Rows>
    ),
    [balanceDisplay, name],
  );

  const rightColumn = useMemo(
    () => (
      <Box
        borderColor="buttonStroke"
        borderRadius="round"
        borderWidth="1px"
        padding="8px"
        background="surfaceMenu"
      >
        {nativeBalanceDisplay}
      </Box>
    ),
    [nativeBalanceDisplay],
  );

  return (
    <Box
      className={rowTransparentAccentHighlight}
      borderRadius="12px"
      style={{ height: '52px' }}
    >
      <RowHighlightWrapper>
        <Inset horizontal="12px" vertical="8px">
          <Rows>
            <Row>
              <Columns alignVertical="center" space="8px">
                <Column width="content">
                  <CoinIcon asset={asset} />
                </Column>
                <Column>{leftColumn}</Column>
                <Column width="content">{rightColumn}</Column>
              </Columns>
            </Row>
          </Rows>
        </Inset>
      </RowHighlightWrapper>
    </Box>
  );
}
