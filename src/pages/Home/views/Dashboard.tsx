import { Grid } from '@mui/material';
import { BarDatum } from '@nivo/bar';
import dayjs from 'dayjs';
import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FFArrowButton } from '../../../components/Buttons/FFArrowButton';
import { EmptyStateCard } from '../../../components/Cards/EmptyStateCard';
import { EventCardWrapper } from '../../../components/Cards/EventCards/EventCardWrapper';
import { SkeletonCard } from '../../../components/Cards/EventCards/SkeletonCard';
import { FireFlyCard } from '../../../components/Cards/FireFlyCard';
import { SmallCard } from '../../../components/Cards/SmallCard';
import { Histogram } from '../../../components/Charts/Histogram';
import { Diagram } from '../../../components/Charts/Diagram';
import { Header } from '../../../components/Header';
import { NetworkMap } from '../../../components/NetworkMap/NetworkMap';
import { EventSlide } from '../../../components/Slides/EventSlide';
import { TransactionSlide } from '../../../components/Slides/TransactionSlide';
import { ApplicationContext } from '../../../contexts/ApplicationContext';
import { DateFilterContext } from '../../../contexts/DateFilterContext';
import { SlideContext } from '../../../contexts/SlideContext';
import { SnackbarContext } from '../../../contexts/SnackbarContext';
import {
  BucketCollectionEnum,
  BucketCountEnum,
  FF_EVENTS_CATEGORY_MAP,
  FF_NAV_PATHS,
  FF_OP_CATEGORY_MAP,
  IEvent,
  IFireFlyCard,
  IGenericPagedResponse,
  IMetric,
  ISmallCard,
  ITransaction,
  OpCategoryEnum,
} from '../../../interfaces';
import { FF_Paths } from '../../../interfaces/constants';
import { DEFAULT_PADDING, DEFAULT_SPACING } from '../../../theme';
import {
  fetchCatcher,
  makeEventHistogram,
  makeMultipleQueryParams,
} from '../../../utils';
import {
  isHistogramEmpty,
  makeColorArray,
  makeKeyArray,
} from '../../../utils/charts';
import { hasAnyEvent } from '../../../utils/wsEvents';

export const HomeDashboard: () => JSX.Element = () => {
  const { t } = useTranslation();
  const { newEvents, lastRefreshTime, clearNewEvents, selectedNamespace } =
    useContext(ApplicationContext);
  const { dateFilter } = useContext(DateFilterContext);
  const { slideID, setSlideSearchParam } = useContext(SlideContext);
  const { reportFetchError } = useContext(SnackbarContext);
  const [isMounted, setIsMounted] = useState(false);
  const [viewTx, setViewTx] = useState<ITransaction>();
  const [viewEvent, setViewEvent] = useState<IEvent>();
  // Small cards
  // Blockchain
  const [blockchainTxCount, setBlockchainTxCount] = useState<number>();
  const [blockchainEventCount, setBlockchainEventCount] = useState<number>();
  // Messages
  const [messagesBroadcastCount, setMessagesBroadcastCount] =
    useState<number>();
  const [messagesPrivateCount, setMessagesPrivateCount] = useState<number>();
  // Tokens
  const [tokenTransfersCount, setTokenTransfersCount] = useState<number>();
  const [tokenMintCount, setTokenMintcount] = useState<number>();
  const [tokenBurnCount, setTokenBurnCount] = useState<number>();
  // Operations
  const [blockchainOperationsCount, setBlockchainOperationsCount] =
    useState<number>();
  const [messageOperationsCount, setMessageOperationsCount] =
    useState<number>();
  const [tokensOperationsCount, setTokensOperationsCount] = useState<number>();
  const [operationsErrorCount, setOperationsErrorCount] = useState<number>();

  // Medium cards
  // Event types histogram
  const [eventHistData, setEventHistData] = useState<BarDatum[]>();
  // Table cards
  const [recentEventTxs, setRecentEventTxs] = useState<IEvent[]>();
  const [recentEvents, setRecentEvents] = useState<IEvent[]>();
  const [isHistLoading, setIsHistLoading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  useEffect(() => {
    if (isMounted && slideID) {
      fetchCatcher(
        `${FF_Paths.nsPrefix}/${selectedNamespace}${FF_Paths.events}?id=${slideID}`
      ).then((eventRes: IEvent[]) => {
        isMounted && eventRes.length > 0 && setViewEvent(eventRes[0]);
      });
      fetchCatcher(
        `${FF_Paths.nsPrefix}/${selectedNamespace}${FF_Paths.transactions}?id=${slideID}`
      ).then((txRes: ITransaction[]) => {
        isMounted && txRes.length > 0 && setViewTx(txRes[0]);
      });
    }
  }, [slideID, isMounted]);

  const smallCards: ISmallCard[] = [
    {
      header: t('blockchain'),
      data: [
        { header: t('transactions'), data: blockchainTxCount },
        { header: t('events'), data: blockchainEventCount },
      ],
      clickPath: FF_NAV_PATHS.blockchainPath(selectedNamespace),
    },
    {
      header: t('messages'),
      data: [
        { header: t('broadcast'), data: messagesBroadcastCount },
        { header: t('private'), data: messagesPrivateCount },
      ],
      clickPath: FF_NAV_PATHS.offchainPath(selectedNamespace),
    },
    {
      header: t('tokens'),
      data: [
        { header: t('transfers'), data: tokenTransfersCount },
        { header: t('mint'), data: tokenMintCount },
        { header: t('burn'), data: tokenBurnCount },
      ],
      clickPath: FF_NAV_PATHS.tokensPath(selectedNamespace),
    },
    {
      header: t('operations'),
      numErrors: operationsErrorCount,
      errorLink: FF_NAV_PATHS.activityOpErrorPath(selectedNamespace),
      data: [
        { header: t('blockchain'), data: blockchainOperationsCount },
        { header: t('messages'), data: messageOperationsCount },
        { header: t('tokens'), data: tokensOperationsCount },
      ],
      clickPath: FF_NAV_PATHS.activityOpPath(selectedNamespace),
    },
  ];

  // Small Card UseEffect
  useEffect(() => {
    const qParams = `?count=true&limit=1${dateFilter?.filterString ?? ''}`;

    isMounted &&
      dateFilter &&
      Promise.all([
        // Blockchain
        fetchCatcher(
          `${FF_Paths.nsPrefix}/${selectedNamespace}${FF_Paths.transactions}${qParams}&blockchainids=!`
        ),
        fetchCatcher(
          `${FF_Paths.nsPrefix}/${selectedNamespace}${FF_Paths.blockchainEvents}${qParams}`
        ),
        // Messages
        fetchCatcher(
          `${FF_Paths.nsPrefix}/${selectedNamespace}${FF_Paths.messages}${qParams}&type=broadcast`
        ),
        fetchCatcher(
          `${FF_Paths.nsPrefix}/${selectedNamespace}${FF_Paths.messages}${qParams}&type=private`
        ),
        // Tokens
        fetchCatcher(
          `${FF_Paths.nsPrefix}/${selectedNamespace}${FF_Paths.tokenTransfers}${qParams}&type=transfer`
        ),
        fetchCatcher(
          `${FF_Paths.nsPrefix}/${selectedNamespace}${FF_Paths.tokenTransfers}${qParams}&type=mint`
        ),
        fetchCatcher(
          `${FF_Paths.nsPrefix}/${selectedNamespace}${FF_Paths.tokenTransfers}${qParams}&type=burn`
        ),
        // Operations
        fetchCatcher(
          `${FF_Paths.nsPrefix}/${selectedNamespace}${
            FF_Paths.operations
          }${qParams}${makeMultipleQueryParams(
            FF_OP_CATEGORY_MAP,
            OpCategoryEnum.BLOCKCHAIN,
            'type'
          )}`
        ),
        fetchCatcher(
          `${FF_Paths.nsPrefix}/${selectedNamespace}${
            FF_Paths.operations
          }${qParams}${makeMultipleQueryParams(
            FF_OP_CATEGORY_MAP,
            OpCategoryEnum.MESSAGES,
            'type'
          )}`
        ),
        fetchCatcher(
          `${FF_Paths.nsPrefix}/${selectedNamespace}${
            FF_Paths.operations
          }${qParams}${makeMultipleQueryParams(
            FF_OP_CATEGORY_MAP,
            OpCategoryEnum.TOKENS,
            'type'
          )}`
        ),
        fetchCatcher(
          `${FF_Paths.nsPrefix}/${selectedNamespace}${FF_Paths.operations}${qParams}&error=!`
        ),
      ])
        .then(
          ([
            blockchainTx,
            blockchainEvents,
            msgsBroadcast,
            msgPrivate,
            tokensTransfer,
            tokensMint,
            tokensBurn,
            opsBlockchain,
            opsMessages,
            opsTokens,
            opsErrors,
          ]: IGenericPagedResponse[]) => {
            if (isMounted) {
              // Blockchain
              setBlockchainTxCount(blockchainTx.total);
              setBlockchainEventCount(blockchainEvents.total);
              // Messages
              setMessagesBroadcastCount(msgsBroadcast.total);
              setMessagesPrivateCount(msgPrivate.total);
              // Tokens
              setTokenTransfersCount(tokensTransfer.total);
              setTokenMintcount(tokensMint.total);
              setTokenBurnCount(tokensBurn.total);
              // Operations
              setBlockchainOperationsCount(opsBlockchain.total);
              setMessageOperationsCount(opsMessages.total);
              setTokensOperationsCount(opsTokens.total);
              setOperationsErrorCount(opsErrors.total);
            }
          }
        )
        .catch((err) => {
          reportFetchError(err);
        });
  }, [selectedNamespace, dateFilter, lastRefreshTime, isMounted]);

  const mediumCards: IFireFlyCard[] = [
    {
      headerComponent: (
        <FFArrowButton
          link={FF_NAV_PATHS.activityTimelinePath(selectedNamespace)}
        />
      ),
      headerText: t('activity'),
      component: (
        <Histogram
          height={'100%'}
          colors={makeColorArray(FF_EVENTS_CATEGORY_MAP)}
          data={eventHistData}
          indexBy="timestamp"
          keys={makeKeyArray(FF_EVENTS_CATEGORY_MAP)}
          emptyText={t('noActivity')}
          isLoading={isHistLoading}
          isEmpty={isHistogramEmpty(eventHistData ?? [])}
          includeLegend={true}
        />
      ),
    },
    {
      headerComponent: (
        <FFArrowButton link={FF_NAV_PATHS.networkPath(selectedNamespace)} />
      ),
      headerText: t('networkMap'),
      component: <NetworkMap size="small"></NetworkMap>,
    },
    {
      headerComponent: (
        <FFArrowButton link={FF_NAV_PATHS.myNodePath(selectedNamespace)} />
      ),
      headerText: t('myNode'),
      component: <Diagram data={[]} isLoading={false} />,
    },
  ];

  // Medium Card UseEffect
  useEffect(() => {
    setIsHistLoading(true);
    const currentTime = dayjs().unix();

    if (isMounted && dateFilter) {
      fetchCatcher(
        `${FF_Paths.nsPrefix}/${selectedNamespace}${FF_Paths.chartsHistogram(
          BucketCollectionEnum.Events,
          dateFilter.filterTime,
          currentTime,
          BucketCountEnum.Small
        )}`
      )
        .then((histTypes: IMetric[]) => {
          setEventHistData(makeEventHistogram(histTypes));
        })
        .catch((err) => {
          setEventHistData([]);
          reportFetchError(err);
        })
        .finally(() => setIsHistLoading(false));
    }
  }, [selectedNamespace, dateFilter, lastRefreshTime, isMounted]);

  const skeletonList = () => (
    <>
      {Array.from(Array(7)).map((_, idx) => (
        <Grid
          item
          container
          alignItems="flex-start"
          justifyContent="flex-start"
          key={idx}
        >
          <SkeletonCard />
          <Grid sx={{ padding: '1px' }} />
        </Grid>
      ))}
    </>
  );

  const tableCards: IFireFlyCard[] = [
    // Recently submitted Transactions
    {
      headerText: t('myRecentTransactions'),
      headerComponent: (
        <FFArrowButton
          link={FF_NAV_PATHS.activityTimelinePath(selectedNamespace)}
        />
      ),
      component: (
        <>
          {recentEventTxs?.length === 0 ? (
            <EmptyStateCard text={t('noRecentTransactions')} />
          ) : (
            <Grid
              container
              direction="column"
              item
              alignItems="flex-start"
              justifyContent="flex-start"
            >
              {!recentEventTxs
                ? skeletonList()
                : recentEventTxs.map((event, idx) => (
                    <Grid
                      item
                      container
                      alignItems="flex-start"
                      justifyContent="flex-start"
                      key={idx}
                    >
                      <EventCardWrapper
                        onHandleViewTx={(tx: ITransaction) => {
                          setViewTx(tx);
                          setSlideSearchParam(tx.id);
                        }}
                        link={
                          event.tx
                            ? FF_NAV_PATHS.activityTxDetailPath(
                                selectedNamespace,
                                event.tx
                              )
                            : FF_NAV_PATHS.activityTxPath(selectedNamespace)
                        }
                        {...{ event }}
                      />
                      <Grid sx={{ padding: '1px' }} />
                    </Grid>
                  ))}
            </Grid>
          )}
        </>
      ),
    },
    // Recent Network Events
    {
      headerText: t('recentNetworkEvents'),
      headerComponent: (
        <FFArrowButton
          link={FF_NAV_PATHS.activityTimelinePath(selectedNamespace)}
        />
      ),
      component: (
        <>
          {recentEvents?.length === 0 ? (
            <EmptyStateCard text={t('noRecentNetworkEvents')} />
          ) : (
            <Grid
              container
              direction="column"
              item
              alignItems="flex-start"
              justifyContent="flex-start"
            >
              {!recentEvents
                ? skeletonList()
                : recentEvents.map((event, idx) => (
                    <Grid
                      item
                      container
                      alignItems="flex-start"
                      justifyContent="flex-start"
                      key={idx}
                    >
                      <EventCardWrapper
                        onHandleViewEvent={(event: IEvent) => {
                          setViewEvent(event);
                          setSlideSearchParam(event.id);
                        }}
                        link={
                          event.tx
                            ? FF_NAV_PATHS.activityTxDetailPathWithSlide(
                                selectedNamespace,
                                event.tx,
                                event.id
                              )
                            : FF_NAV_PATHS.activityEventsPath(
                                selectedNamespace,
                                event.id
                              )
                        }
                        {...{ event }}
                      />
                      <Grid sx={{ padding: '1px' }} />
                    </Grid>
                  ))}
            </Grid>
          )}
        </>
      ),
    },
  ];
  // Table Card UseEffect
  useEffect(() => {
    const qParams = `?limit=25${dateFilter?.filterString ?? ''}`;
    isMounted &&
      dateFilter &&
      Promise.all([
        fetchCatcher(
          `${FF_Paths.nsPrefix}/${selectedNamespace}${FF_Paths.events}${qParams}&type=transaction_submitted&fetchreferences=true`
        ),
        fetchCatcher(
          `${FF_Paths.nsPrefix}/${selectedNamespace}${FF_Paths.events}${qParams}&type=!transaction_submitted&fetchreferences=true`
        ),
      ])
        .then(([recentEventTxs, recentEvents]) => {
          if (isMounted) {
            setRecentEventTxs(recentEventTxs);
            setRecentEvents(recentEvents);
          }
        })
        .catch((err) => {
          reportFetchError(err);
        });
  }, [selectedNamespace, lastRefreshTime, , dateFilter, isMounted]);

  return (
    <>
      <Header
        title={'Dashboard'}
        subtitle={'Home'}
        showRefreshBtn={hasAnyEvent(newEvents)}
        onRefresh={clearNewEvents}
      ></Header>
      <Grid container px={DEFAULT_PADDING}>
        <Grid container item wrap="nowrap" direction="column">
          {/* Small Cards */}
          <Grid
            spacing={DEFAULT_SPACING}
            container
            item
            direction="row"
            pb={DEFAULT_PADDING}
          >
            {smallCards.map((card) => {
              return (
                <Grid
                  key={card.header}
                  sm={12}
                  md={12}
                  lg={3}
                  direction="column"
                  alignItems="center"
                  justifyContent="center"
                  container
                  item
                >
                  <SmallCard card={card} />
                </Grid>
              );
            })}
          </Grid>
          {/* Medium Cards */}
          <Grid
            spacing={DEFAULT_SPACING}
            container
            justifyContent="center"
            alignItems="center"
            direction="row"
            pb={DEFAULT_PADDING}
          >
            {mediumCards.map((card) => {
              return (
                <Grid
                  key={card.headerText}
                  direction="column"
                  alignItems="center"
                  justifyContent="center"
                  container
                  item
                  md={12}
                  lg={4}
                >
                  <FireFlyCard card={card} position="flex-start" />
                </Grid>
              );
            })}
          </Grid>
          {/* Tables */}
          <Grid
            spacing={DEFAULT_SPACING}
            container
            item
            direction="row"
            pb={DEFAULT_PADDING}
          >
            {tableCards.map((card, idx) => {
              return (
                <Grid
                  key={idx}
                  direction="column"
                  alignItems="center"
                  justifyContent="center"
                  container
                  item
                  sm={12}
                  md={6}
                >
                  <FireFlyCard position="flex-start" key={idx} card={card} />
                </Grid>
              );
            })}
          </Grid>
        </Grid>
      </Grid>
      {viewTx && (
        <TransactionSlide
          transaction={viewTx}
          open={!!viewTx}
          onClose={() => {
            setViewTx(undefined);
            setSlideSearchParam(null);
          }}
        />
      )}
      {viewEvent && (
        <EventSlide
          event={viewEvent}
          open={!!viewEvent}
          onClose={() => {
            setViewEvent(undefined);
            setSlideSearchParam(null);
          }}
        />
      )}
    </>
  );
};
