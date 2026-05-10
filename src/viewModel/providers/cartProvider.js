import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

import { supabase } from "../../model/supabase";
import { useUserRole } from "../hooks/useUserRole";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { userProfile } = useUserRole();

  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  const userId = userProfile?.acc_id;

  const fetchCart = useCallback(async () => {
    if (!userId) {
      setCart([]);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("accounts_m2m_items")
      .select("ai_it_id, ai_amount")
      .eq("ai_acc_id", userId);

    if (error) {
      console.error("Ошибка загрузки корзины:", error);
    } else {
      setCart(data || []);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const updateCartItem = async (itemId, amount) => {
    if (!userId) return;

    let nextCart = [...cart];

    const index = nextCart.findIndex(
      (c) => Number(c.ai_it_id) === Number(itemId)
    );

    if (amount <= 0) {
      const { error } = await supabase
        .from("accounts_m2m_items")
        .delete()
        .eq("ai_acc_id", userId)
        .eq("ai_it_id", itemId);

      if (error) {
        console.error(error);
        return;
      }

      nextCart = nextCart.filter(
        (c) => Number(c.ai_it_id) !== Number(itemId)
      );
    } else {
      const { error } = await supabase
        .from("accounts_m2m_items")
        .upsert({
          ai_acc_id: userId,
          ai_it_id: itemId,
          ai_amount: amount,
        });

      if (error) {
        console.error(error);
        return;
      }

      if (index >= 0) {
        nextCart[index] = {
          ...nextCart[index],
          ai_amount: amount,
        };
      } else {
        nextCart.push({
          ai_it_id: itemId,
          ai_amount: amount,
        });
      }
    }

    setCart(nextCart);
  };

  const getItemAmount = (itemId) => {
    return (
      cart.find(
        (c) => Number(c.ai_it_id) === Number(itemId)
      )?.ai_amount || 0
    );
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        fetchCart,
        updateCartItem,
        getItemAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);