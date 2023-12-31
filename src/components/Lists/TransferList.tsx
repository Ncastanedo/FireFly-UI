import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApplicationContext } from '../../contexts/ApplicationContext';
import { ITokenTransferWithPool, ITxStatus } from '../../interfaces';
import { IDataListItem } from '../../interfaces/lists';
import { addDecToAmount, getBalanceTooltip } from '../../utils';
import { FFCopyButton } from '../Buttons/CopyButton';
import { MsgButton } from '../Buttons/MsgButton';
import { PoolButton } from '../Buttons/PoolButton';
import { TxButton } from '../Buttons/TxButton';
import { TxStatusChip } from '../Chips/TxStatusChip';
import { FFListItem } from './FFListItem';
import { FFListText } from './FFListText';
import { FFListTimestamp } from './FFListTimestamp';
import { FFSkeletonList } from './FFSkeletonList';

interface Props {
  transfer?: ITokenTransferWithPool;
  txStatus?: ITxStatus;
  showTxLink?: boolean;
  showPoolLink?: boolean;
}

export const TransferList: React.FC<Props> = ({
  transfer,
  txStatus,
  showTxLink = true,
  showPoolLink = true,
}) => {
  const { selectedNamespace } = useContext(ApplicationContext);
  const { t } = useTranslation();
  const [dataList, setDataList] = useState<IDataListItem[]>(FFSkeletonList);

  useEffect(() => {
    if (transfer) {
      setDataList([
        {
          label: t('localID'),
          value: <FFListText color="primary" text={transfer.localId} />,
          button: <FFCopyButton value={transfer.localId} />,
        },
        {
          label: t('transactionID'),
          value: transfer.tx?.id ? (
            <FFListText color="primary" text={transfer.tx.id} />
          ) : (
            <FFListText
              color="secondary"
              text={t('transactionIDUnavailable')}
            />
          ),
          button: transfer.tx?.id ? (
            <>
              {showTxLink && (
                <TxButton ns={selectedNamespace} txID={transfer.tx.id} />
              )}
              <FFCopyButton value={transfer.tx.id} />
            </>
          ) : undefined,
        },
        {
          label: t('signingKey'),
          value: <FFListText color="primary" text={transfer.key} />,
          button: <FFCopyButton value={transfer.key} />,
        },
        {
          label: t('from'),
          value: transfer.from ? (
            <FFListText color="primary" text={transfer.from} />
          ) : (
            <FFListText color="secondary" text={t('nullAddress')} />
          ),
          button: transfer.from ? (
            <FFCopyButton value={transfer.from} />
          ) : undefined,
        },
        {
          label: t('to'),
          value: transfer.to ? (
            <FFListText color="primary" text={transfer.to} />
          ) : (
            <FFListText color="secondary" text={t('nullAddress')} />
          ),
          button: transfer.to ? (
            <FFCopyButton value={transfer.to} />
          ) : undefined,
        },
        {
          label: t('amount'),
          value: (
            <FFListText
              color="primary"
              text={addDecToAmount(
                transfer.amount,
                transfer.poolObject ? transfer.poolObject.decimals : -1
              )}
              tooltip={getBalanceTooltip(
                transfer.amount,
                transfer.poolObject ? transfer.poolObject.decimals : -1
              )}
            />
          ),
          button: <FFCopyButton value={transfer.amount} />,
        },
        {
          label: transfer.tokenIndex ? t('tokenIndex') : '',
          value: (
            <FFListText color="primary" text={transfer.tokenIndex ?? ''} />
          ),
          button: <FFCopyButton value={transfer.tokenIndex ?? ''} />,
        },
        {
          label: transfer.uri ? t('uri') : '',
          value: <FFListText color="primary" text={transfer.uri ?? ''} />,
          button: <FFCopyButton value={transfer.uri ?? ''} />,
        },
        {
          label: t('messageID'),
          value: transfer.message ? (
            <FFListText color="primary" text={transfer.message} />
          ) : (
            <FFListText color="secondary" text={t('noMessageInTransfer')} />
          ),
          button: transfer.message ? (
            <>
              <MsgButton ns={selectedNamespace} msgID={transfer.message} />
              <FFCopyButton value={transfer.message} />
            </>
          ) : undefined,
        },
        {
          label: t('poolID'),
          value: <FFListText color="primary" text={transfer.pool} />,
          button: (
            <>
              {showPoolLink && (
                <PoolButton ns={selectedNamespace} poolID={transfer.pool} />
              )}
              <FFCopyButton value={transfer.pool} />
            </>
          ),
        },
        {
          label: txStatus ? t('status') : '',
          value: txStatus && <TxStatusChip txStatus={txStatus} />,
        },
        {
          label: t('created'),
          value: <FFListTimestamp ts={transfer.created} />,
        },
      ]);
    }
  }, [transfer, txStatus]);

  return (
    <>
      {dataList.map(
        (d, idx) => d.label !== '' && <FFListItem key={idx} item={d} />
      )}
    </>
  );
};
