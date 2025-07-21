import { BigNumber } from 'ethers';
import { Schema, model } from 'mongoose';

const decimalBigInt = (extra: Partial<Record<string, any>> = {}) => ({
  get(value: string) {
    return BigNumber.from(value);
  },
  required: true,
  set(value: BigNumber | string | number) {
    if (BigNumber.isBigNumber(value)) return value.toString();
    if (typeof value === 'number') return value.toLocaleString('en-US', { useGrouping: false });
    return value;
  },
  type: String,
  validate: {
    message: '{VALUE} is not a valid decimal string',
    validator: (v: string) => /^\d+$/.test(v),
  },
  ...extra,
});

const depositSchema = new Schema(
  {
    approval: {
      approvalTxHash: { required: false, type: String },
      approvedAmount: { required: true, type: String },
      spenderAddress: { required: true, type: String },
      tokenAddress: { required: true, type: String },
      tokenDecimals: { required: true, type: Number },
    },
    deposit: {
      amount: { required: true, type: String },
      operation: { required: true, type: String },
      timestamp: { required: true, type: Number },
      txHash: { required: true, type: String },
      vaultAddress: { required: true, type: String },
    },
  },
  {
    _id: false,
  }
);

const vaultAssetSchema = new Schema(
  {
    address: { required: true, type: String },
    decimals: { required: true, type: Number },
    name: { required: true, type: String },
    symbol: { required: true, type: String },
  },
  {
    _id: false,
  }
);

const vaultStateSchema = new Schema(
  {
    apy: { required: true, type: Number },
    avgApy: { required: true, type: Number },
    avgNetApy: { required: true, type: Number },
    netApy: { required: true, type: Number },
  },
  {
    _id: false,
  }
);

const vaultSchema = new Schema(
  {
    address: { required: true, type: String },
    asset: { required: true, type: vaultAssetSchema },
    chain: {
      id: { required: true, type: Number },
      network: { required: true, type: String },
    },
    id: { required: true, type: String },
    name: { required: true, type: String },
    state: { required: true, type: vaultStateSchema },
    symbol: { required: true, type: String },
    whitelisted: { required: true, type: Boolean },
  },
  {
    _id: false,
  }
);

const tokenBalanceSchema = new Schema(
  {
    address: { required: true, type: String },
    balance: decimalBigInt(),
    decimals: { required: true, type: Number },
  },
  {
    _id: false,
  }
);

const morphoSwapSchemaDefinition = {
  deposits: { default: [], required: true, type: [depositSchema] },
  scheduleId: {
    index: true,
    required: true,
    type: Schema.Types.ObjectId,
  },
  success: { required: true, type: Boolean },
  topVault: { required: true, type: vaultSchema },
  userPositions: { required: false, type: Schema.Types.Mixed },
  userTokenBalance: { required: true, type: tokenBalanceSchema },
  walletAddress: {
    index: true,
    lowercase: true,
    match: /^0x[a-fA-F0-9]{40}$/,
    required: true,
    type: String,
  },
  withdrawals: { default: [], required: true, type: [Schema.Types.Mixed] },
} as const;

const MorphoSwapSchema = new Schema(morphoSwapSchemaDefinition, { timestamps: true });

// Create compound indices for common query patterns
MorphoSwapSchema.index({ createdAt: 1, scheduleId: 1 });

export const MorphoSwap = model('MorphoSwap', MorphoSwapSchema);
