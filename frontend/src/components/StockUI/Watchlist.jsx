'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import Button from '../ui/Button';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/config/supabaseClient';

export default function Watchlist({ isProfileView = false, stockId = null }) {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        fetchWatchlist(session.user.id);
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    if (stockId && watchlist.length > 0) {
      setIsInWatchlist(watchlist.some(item => item.stock.id === stockId));
    }
  }, [stockId, watchlist]);

  const fetchWatchlist = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          stock_id,
          stock:stock_id (
            id,
            tick,
            name,
            current_price
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;
      setWatchlist(data || []);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      toast.error('Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatchlist = async (stockId) => {
    if (!stockId || !user) {
      toast.error('Invalid stock ID or user not logged in');
      return;
    }
    setButtonLoading(true);
    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('stock_id', stockId);

      if (error) throw error;
      await fetchWatchlist(user.id); // Always refresh after removal
      setIsInWatchlist(false);
      toast.success('Removed from watchlist');
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      toast.error('Failed to remove from watchlist');
    } finally {
      setButtonLoading(false);
    }
  };

  const addToWatchlist = async (stockId) => {
    if (!stockId || !user) {
      toast.error('Invalid stock ID or user not logged in');
      return;
    }
    setButtonLoading(true);
    try {
      // First check if the stock is already in the wishlist
      const { data: existingEntry, error: checkError } = await supabase
        .from('wishlist')
        .select('stock_id')
        .eq('user_id', user.id)
        .eq('stock_id', stockId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw checkError;
      }

      if (existingEntry) {
        toast.info('Stock is already in your watchlist');
        setIsInWatchlist(true);
        return;
      }

      // Verify the stock exists
      const { data: stockData, error: stockError } = await supabase
        .from('stock')
        .select('id')
        .eq('id', stockId)
        .single();

      if (stockError || !stockData) {
        toast.error('Invalid stock');
        return;
      }

      const { error } = await supabase
        .from('wishlist')
        .insert([
          {
            user_id: user.id,
            stock_id: stockId
          }
        ]);

      if (error) throw error;
      await fetchWatchlist(user.id); // Always refresh after add
      setIsInWatchlist(true);
      toast.success('Added to watchlist');
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      toast.error('Failed to add to watchlist');
    } finally {
      setButtonLoading(false);
    }
  };

  if (loading) {
    return <div>Loading watchlist...</div>;
  }

  if (isProfileView) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Watchlist</CardTitle>
        </CardHeader>
        <CardContent>
          {watchlist.length === 0 ? (
            <div className="text-gray-500">No stocks in your watchlist yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {watchlist.map((item) => (
                  <TableRow key={item.stock_id}>
                    <TableCell className="font-medium">{item.stock?.tick || '-'}</TableCell>
                    <TableCell>{item.stock?.name || '-'}</TableCell>
                    <TableCell>{item.stock?.current_price !== undefined ? `$${item.stock.current_price.toFixed(2)}` : 'N/A'}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromWatchlist(item.stock?.id)}
                        title="Remove from Watchlist"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    );
  }

  // For explore page - just the watchlist button
  if (!stockId) {
    return null; // Don't render anything if stockId is not available
  }

  return (
    <Button
      variant={isInWatchlist ? "destructive" : "default"}
      size="sm"
      onClick={() => isInWatchlist ? removeFromWatchlist(stockId) : addToWatchlist(stockId)}
      className="flex-1"
      disabled={buttonLoading}
    >
      {buttonLoading
        ? (isInWatchlist ? 'Removing...' : 'Adding...')
        : (isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist')}
    </Button>
  );
} 