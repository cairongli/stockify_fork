'use client';
import React from 'react';
import StockPage from '@/components/StockUI/StockChart';

const StockProfilePage = ({ params }) => {
  const resolvedParams = React.use(params);
  const { symbol } = resolvedParams;

  return (
    <StockPage symbol={symbol} />
  );
};

export default StockProfilePage;