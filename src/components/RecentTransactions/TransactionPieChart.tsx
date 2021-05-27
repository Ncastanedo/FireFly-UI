import React from 'react';
import { PieCustomLayer, ResponsivePie } from '@nivo/pie';
import { makeStyles } from '@material-ui/core';
import { IPieChartElement } from '../../interfaces';
import { useTranslation } from 'react-i18next';
import { LegendProps } from '@nivo/legends';

interface Props {
  data: IPieChartElement[];
}

export const TransactionPieChart: React.FC<Props> = ({ data }) => {
  const classes = useStyles();
  const { t } = useTranslation();

  const CenteredMetric: PieCustomLayer<IPieChartElement> = ({
    dataWithArc,
    centerX,
    centerY,
  }) => {
    let total = 0;
    dataWithArc.forEach((datum) => {
      total += datum.value;
    });

    return (
      <text
        x={centerX}
        y={centerY}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fill: '#9BA7B0',
          fontSize: '2ch',
        }}
      >
        {total} {t('transactions')}
      </text>
    );
  };

  const legends: LegendProps[] = [
    {
      anchor: 'bottom',
      data: [],
      direction: 'row',
      justify: false,
      translateX: 30,
      translateY: 56,
      itemWidth: 100,
      itemHeight: 18,
      itemTextColor: '#999',
      itemDirection: 'left-to-right',
      itemOpacity: 1,
      symbolSize: 18,
      symbolShape: 'circle',
      padding: 0,
    },
  ];

  return (
    <div className={classes.responsiveParent}>
      <div className={classes.responsiveChartWrapper}>
        <ResponsivePie
          data={data}
          margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
          innerRadius={0.8}
          padAngle={0.7}
          cornerRadius={3}
          // labels of placeholder values will not be shown
          arcLinkLabelsSkipAngle={1}
          colors={{ datum: 'data.color' }}
          activeOuterRadiusOffset={8}
          borderWidth={1}
          enableArcLabels={false}
          borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
          arcLinkLabelsTextColor="#9BA7B0"
          arcLinkLabel={(d) => `${d.id}: ${d.value}`}
          // change tooltip text color
          theme={{ tooltip: { container: { color: 'black' } } }}
          legends={legends}
          layers={['arcs', 'arcLinkLabels', 'legends', CenteredMetric]}
        />
      </div>
    </div>
  );
};

const useStyles = makeStyles(() => ({
  responsiveParent: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  responsiveChartWrapper: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
}));