import React, { useCallback, useState } from 'react';

import { analytics } from '~/analytics';
import { event } from '~/analytics/event';
import { i18n } from '~/core/languages';
import { initializeMessenger } from '~/core/messengers';
import { supportedCurrencies } from '~/core/references';
import {
  RAINBOW_FEEDBACK_URL,
  RAINBOW_LEARN_URL,
  RAINBOW_SUPPORT_URL,
  RAINBOW_TWITTER_URL,
} from '~/core/references/links';
import { themeOptions } from '~/core/references/themes';
import { useCurrentCurrencyStore } from '~/core/state';
import { useConnectedToHardhatStore } from '~/core/state/currentSettings/connectedToHardhat';
import { useCurrentThemeStore } from '~/core/state/currentSettings/currentTheme';
import {
  FeatureFlagTypes,
  useFeatureFlagsStore,
} from '~/core/state/currentSettings/featureFlags';
import { useIsDefaultWalletStore } from '~/core/state/currentSettings/isDefaultWallet';
import { ThemeOption } from '~/core/types/settings';
import { Box, Inline, Symbol, Text } from '~/design-system';
import { Lens } from '~/design-system/components/Lens/Lens';
import { Toggle } from '~/design-system/components/Toggle/Toggle';
import { Menu } from '~/entries/popup/components/Menu/Menu';
import { MenuContainer } from '~/entries/popup/components/Menu/MenuContainer';
import { MenuItem } from '~/entries/popup/components/Menu/MenuItem';
import { SwitchMenu } from '~/entries/popup/components/SwitchMenu/SwitchMenu';
import { logger } from '~/logger';

import packageJson from '../../../../../package.json';
import { testSandbox } from '../../handlers/wallet';
import { useRainbowNavigate } from '../../hooks/useRainbowNavigate';
import { ROUTES } from '../../urls';

const messenger = initializeMessenger({ connect: 'inpage' });

export function Settings() {
  const navigate = useRainbowNavigate();
  const { currentCurrency } = useCurrentCurrencyStore();
  const { isDefaultWallet, setIsDefaultWallet } = useIsDefaultWalletStore();
  const { featureFlags, setFeatureFlag } = useFeatureFlagsStore();

  const { currentUserSelectedTheme, currentTheme, setCurrentTheme } =
    useCurrentThemeStore();
  const { connectedToHardhat, setConnectedToHardhat } =
    useConnectedToHardhatStore();

  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);

  const testSandboxBackground = useCallback(async () => {
    const response = await testSandbox();

    alert(response);
  }, []);

  // Dev only!
  const generateFCMToken = useCallback(async () => {
    chrome.gcm.register(
      [process.env.FIREBASE_SENDER_ID_BX],
      (registrationId: string) => {
        logger.info('Token: ', { registrationId });
        logger.info('Now listening on the popup...');

        chrome.gcm.onMessage.addListener(
          (message: chrome.gcm.IncomingMessage) => {
            logger.info('got message', { message });
            alert('message from FCM: ' + JSON.stringify(message, null, 2));
          },
        );
      },
    );
  }, []);

  const toggleFeatureFlag = useCallback(
    (key: FeatureFlagTypes) => {
      setFeatureFlag(key, !featureFlags[key]);
    },
    [featureFlags, setFeatureFlag],
  );

  const testSandboxPopup = useCallback(async () => {
    try {
      console.log('about to leak...');
      const r = await fetch('https://api.ipify.org?format=json');
      const res = await r.json();
      console.log('response from server after leaking', res);
      alert('Popup leaked!');
    } catch (e) {
      alert('Popup sandboxed!');
    }
  }, []);

  const connectToHardhat = useCallback(() => {
    setConnectedToHardhat(!connectedToHardhat);
  }, [setConnectedToHardhat, connectedToHardhat]);

  const setRainbowAsDefaultWallet = useCallback(
    async (rainbowAsDefault: boolean) => {
      analytics.track(
        rainbowAsDefault
          ? event.settingsRainbowDefaultProviderEnabled
          : event.settingsRainbowDefaultProviderDisabled,
      );
      setIsDefaultWallet(rainbowAsDefault);
      messenger.send('rainbow_setDefaultProvider', { rainbowAsDefault });
    },
    [setIsDefaultWallet],
  );

  return (
    <Box paddingHorizontal="20px">
      <MenuContainer testId="settings-menu-container">
        <Menu>
          <MenuItem
            first
            titleComponent={
              <MenuItem.Title
                text={i18n.t('settings.use_rainbow_as_default_wallet')}
              />
            }
            rightComponent={
              <Toggle
                testId="set-rainbow-default-toggle"
                checked={isDefaultWallet}
                handleChange={setRainbowAsDefaultWallet}
                tabIndex={-1}
              />
            }
            onToggle={() => setRainbowAsDefaultWallet(!isDefaultWallet)}
          />
          <MenuItem.Description
            text={i18n.t('settings.default_wallet_description')}
          />
        </Menu>
        <Menu>
          <MenuItem
            first
            last
            leftComponent={
              <Symbol
                symbol="lock.fill"
                weight="medium"
                size={18}
                color="blue"
              />
            }
            hasRightArrow
            onClick={() => navigate(ROUTES.SETTINGS__PRIVACY)}
            titleComponent={
              <MenuItem.Title
                text={i18n.t('settings.privacy_and_security.title')}
              />
            }
          />
        </Menu>
        <Menu>
          <MenuItem
            first
            hasRightArrow
            leftComponent={
              <Symbol
                symbol="bolt.fill"
                color="red"
                weight="medium"
                size={18}
              />
            }
            onClick={() => navigate(ROUTES.SETTINGS__TRANSACTIONS)}
            titleComponent={
              <MenuItem.Title text={i18n.t('settings.transactions.title')} />
            }
            testId="settings-transactions"
          />
          <MenuItem
            hasRightArrow
            leftComponent={
              <Box style={{ width: 18 }}>
                <Text color="green" size="20pt" weight="regular">
                  {supportedCurrencies[currentCurrency].glyph}
                </Text>
              </Box>
            }
            onClick={() => navigate(ROUTES.SETTINGS__CURRENCY)}
            rightComponent={
              <MenuItem.Selection
                text={supportedCurrencies[currentCurrency].label}
              />
            }
            titleComponent={
              <MenuItem.Title text={i18n.t('settings.currency.title')} />
            }
          />
          <Lens
            borderRadius="6px"
            onKeyDown={() => setThemeDropdownOpen(true)}
            onClick={() => setThemeDropdownOpen(true)}
          >
            <SwitchMenu
              align="end"
              onClose={() => setThemeDropdownOpen(false)}
              open={themeDropdownOpen}
              renderMenuTrigger={
                <MenuItem
                  tabIndex={-1}
                  hasChevron
                  leftComponent={
                    <Symbol
                      symbol={
                        currentTheme === 'light' ? 'sun.max' : 'moon.stars'
                      }
                      color={themeOptions[currentTheme as ThemeOption].color}
                      size={18}
                      weight="medium"
                    />
                  }
                  rightComponent={
                    <MenuItem.Selection
                      text={
                        themeOptions[currentUserSelectedTheme as ThemeOption]
                          .label
                      }
                    />
                  }
                  titleComponent={
                    <MenuItem.Title text={i18n.t('settings.theme.title')} />
                  }
                />
              }
              menuItemIndicator={
                <Symbol
                  symbol="checkmark"
                  color="label"
                  size={12}
                  weight="semibold"
                />
              }
              renderMenuItem={(option, i) => {
                const { label, symbol, color } =
                  themeOptions[option as ThemeOption];

                return (
                  <Box id={`switch-option-item-${i}`}>
                    <Inline space="8px" alignVertical="center">
                      <Inline alignVertical="center" space="8px">
                        <Symbol
                          size={14}
                          symbol={symbol}
                          color={color}
                          weight="semibold"
                        />
                      </Inline>
                      <Text weight="regular" size="14pt">
                        {label}
                      </Text>
                    </Inline>
                  </Box>
                );
              }}
              menuItems={Object.keys(themeOptions)}
              selectedValue={currentUserSelectedTheme}
              onValueChange={(value) => {
                setCurrentTheme(value as ThemeOption);
              }}
            />
          </Lens>
        </Menu>
        <Menu>
          <MenuItem
            first
            leftComponent={<MenuItem.TextIcon icon="📚" />}
            titleComponent={
              <MenuItem.Title text={i18n.t('settings.guides_and_support')} />
            }
            rightComponent={
              <Symbol
                symbol="arrow.up.forward.circle"
                color="labelTertiary"
                size={12}
                weight="semibold"
              />
            }
            onClick={() => window.open(RAINBOW_SUPPORT_URL, '_blank')}
          />
          <MenuItem
            leftComponent={<MenuItem.TextIcon icon="🧠" />}
            titleComponent={
              <MenuItem.Title text={i18n.t('settings.learn_about_ethereum')} />
            }
            rightComponent={
              <Symbol
                symbol="arrow.up.forward.circle"
                color="labelTertiary"
                size={12}
                weight="semibold"
              />
            }
            onClick={() => window.open(RAINBOW_LEARN_URL, '_blank')}
          />
          <MenuItem
            leftComponent={<MenuItem.TextIcon icon="🐦" />}
            titleComponent={
              <MenuItem.Title text={i18n.t('settings.follow_us_on_twitter')} />
            }
            rightComponent={
              <Symbol
                symbol="arrow.up.forward.circle"
                color="labelTertiary"
                size={12}
                weight="semibold"
              />
            }
            onClick={() => window.open(RAINBOW_TWITTER_URL, '_blank')}
          />
          <MenuItem
            last
            leftComponent={<MenuItem.TextIcon icon="💬" />}
            titleComponent={
              <MenuItem.Title text={i18n.t('settings.share_beta_feedback')} />
            }
            rightComponent={
              <Symbol
                symbol="arrow.up.forward.circle"
                color="labelTertiary"
                size={12}
                weight="semibold"
              />
            }
            onClick={() => window.open(RAINBOW_FEEDBACK_URL, '_blank')}
          />
        </Menu>
        {(process.env.IS_TESTING === 'true' ||
          process.env.IS_DEV === 'true') && (
          <Menu>
            <MenuItem.Description text="Below buttons are for testing only" />
            <MenuItem
              titleComponent={<MenuItem.Title text="test sandbox popup" />}
              onClick={testSandboxPopup}
              testId="test-sandbox-popup"
            />
            <MenuItem
              titleComponent={<MenuItem.Title text="test sandbox background" />}
              onClick={testSandboxBackground}
              testId="test-sandbox-background"
            />
            <MenuItem
              last
              titleComponent={
                <MenuItem.Title
                  text={
                    connectedToHardhat
                      ? 'Disconnect from Hardhat'
                      : 'Connect to Hardhat'
                  }
                />
              }
              onClick={connectToHardhat}
              testId="connect-to-hardhat"
            />
          </Menu>
        )}
        {(process.env.IS_DEV === 'true' ||
          process.env.IS_TESTING === 'true') && (
          <Menu>
            <MenuItem.Description text="Feature Flags" />
            {Object.keys(featureFlags).map((key, i) => (
              <MenuItem
                last={Object.keys(featureFlags).length - 1 === i}
                key={i}
                titleComponent={
                  <MenuItem.Title
                    text={i18n.t(`settings.feature_flags.${key}`)}
                  />
                }
                rightComponent={
                  <Toggle
                    tabIndex={-1}
                    testId={`feature-flag-${key}`}
                    checked={featureFlags[key as FeatureFlagTypes]}
                    handleChange={() =>
                      toggleFeatureFlag(key as FeatureFlagTypes)
                    }
                  />
                }
                onToggle={() => toggleFeatureFlag(key as FeatureFlagTypes)}
              />
            ))}
            <MenuItem
              titleComponent={<MenuItem.Title text="Generate FCM token" />}
              onClick={generateFCMToken}
              testId="generate-fcm-token"
            />
          </Menu>
        )}
        <Box padding="10px" alignItems="center" justifyContent="center">
          <Text
            size="12pt"
            weight="semibold"
            color="labelTertiary"
            align="center"
          >
            {packageJson.version}
          </Text>
        </Box>
      </MenuContainer>
    </Box>
  );
}
