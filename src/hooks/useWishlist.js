'use client';

import { useEffect, useState } from 'react';

const WISHLIST_KEY = 'situationcd_wishlist';

export const useWishlist = () => {
  const [wishlistData, setWishlistData] = useState({
    products: [],
    tags: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadWishlist = () => {
      try {
        const saved = localStorage.getItem(WISHLIST_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          // 旧形式との互換性維持
          if (Array.isArray(parsed)) {
            setWishlistData({
              products: parsed,
              tags: []
            });
          } else {
            setWishlistData({
              products: parsed.products || [],
              tags: parsed.tags || []
            });
          }
        }
      } catch (error) {
        console.error('Failed to load wishlist:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWishlist();
  }, []);

  const saveWishlist = (data) => {
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(data));
      setWishlistData(data);
    } catch (error) {
      console.error('Failed to save wishlist:', error);
    }
  };

  const addToWishlist = (product) => {
    const newProducts = [...wishlistData.products];
    if (!newProducts.some(item => item.id === product.id)) {
      newProducts.push({
        id: product.id,
        title: product.title,
        maker: product.maker,
        releaseDate: product.releaseDate,
        affiliateLink: product.affiliateLink,
        thumbnailUrl: product.thumbnailUrl,
        tags: product.tags || [],
        cast: product.cast || []
      });
      saveWishlist({
        ...wishlistData,
        products: newProducts
      });
    }
  };

  const removeFromWishlist = (productId) => {
    const newProducts = wishlistData.products.filter(item => item.id !== productId);
    saveWishlist({
      ...wishlistData,
      products: newProducts
    });
  };

  const isInWishlist = (productId) => {
    return wishlistData.products.some(item => item.id === productId);
  };

  const clearWishlist = () => {
    saveWishlist({
      products: [],
      tags: []
    });
  };

  // タグ関連の関数
  const addTagToWishlist = (tag) => {
    if (!wishlistData.tags.includes(tag)) {
      const newTags = [...wishlistData.tags, tag];
      saveWishlist({
        ...wishlistData,
        tags: newTags
      });
    }
  };

  const removeTagFromWishlist = (tag) => {
    const newTags = wishlistData.tags.filter(t => t !== tag);
    saveWishlist({
      ...wishlistData,
      tags: newTags
    });
  };

  const isTagInWishlist = (tag) => {
    return wishlistData.tags.includes(tag);
  };

  const clearTags = () => {
    saveWishlist({
      ...wishlistData,
      tags: []
    });
  };

  return {
    // 互換性のため wishlist プロパティも提供
    wishlist: wishlistData.products,
    wishlistData,
    isLoading,
    // 作品関連
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
    // タグ関連
    addTagToWishlist,
    removeTagFromWishlist,
    isTagInWishlist,
    clearTags
  };
};