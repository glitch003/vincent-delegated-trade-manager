import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from '@storybook/test';

import { Wallet } from '@/components/wallet';

const meta = {
  title: 'Components/Wallet',
  component: Wallet,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    walletAddress: { control: 'text' },
  },
} satisfies Meta<typeof Wallet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    walletAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  },

  play: async ({ canvasElement, parameters }) => {
    const canvas = within(canvasElement);

    const walletAddress = parameters.walletAddress;
    const explorerButton = canvas.getByText(walletAddress, { selector: 'a' });
    await expect(explorerButton).toBeInTheDocument();

    const refreshBalanceButton = canvas.getByText('Refreshing...', { selector: 'button' });
    await expect(refreshBalanceButton).toBeInTheDocument();
  },
};
