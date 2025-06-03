'use client';

import { useEffect, useState } from 'react';

const WISHLIST_KEY = 'situationcd_wishlist';

export const useWishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadWishlist = () => {
      try {
        const saved = localStorage.getItem(WISHLIST_KEY);
        if (saved) {
          setWishlist(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Failed to load wishlist:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWishlist();
  }, []);

  const saveWishlist = (items) => {
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
      setWishlist(items);
    } catch (error) {
      console.error('Failed to save wishlist:', error);
    }
  };

  const addToWishlist = (product) => {
    const newWishlist = [...wishlist];
    if (!newWishlist.some(item => item.id === product.id)) {
      newWishlist.push({
        id: product.id,
        title: product.title,
        maker: product.maker,
        releaseDate: product.releaseDate,
        affiliateLink: product.affiliateLink,
        thumbnailUrl: product.thumbnailUrl,
        tags: product.tags || [],
        cast: product.cast || []
      });
      saveWishlist(newWishlist);
    }
  };

  const removeFromWishlist = (productId) => {
    const newWishlist = wishlist.filter(item => item.id !== productId);
    saveWishlist(newWishlist);
  };

  const isInWishlist = (productId) => {
    return wishlist.some(item => item.id === productId);
  };

  const clearWishlist = () => {
    saveWishlist([]);
  };

  return {
    wishlist,
    isLoading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist
  };
};