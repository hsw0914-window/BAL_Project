import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBabies, createBaby as apiCreateBaby, updateBaby as apiUpdateBaby, deleteBaby as apiDeleteBaby } from './services/api';
import { useAuth } from './AuthContext';

const ACTIVE_KEY = 'bal_active_baby_id';

const BabyCtx = createContext({
  babies: [],
  activeBaby: null,
  refreshBabies: async () => {},
  setActiveBaby: () => {},
  addBaby: async () => {},
  editBaby: async () => {},
  removeBaby: async () => {},
});

export function BabyProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [babies, setBabies] = useState([]);
  const [activeId, setActiveId] = useState(null);

  const refreshBabies = useCallback(async () => {
    try {
      const list = await getBabies();
      setBabies(list);
      if (list.length > 0) {
        const stored = await AsyncStorage.getItem(ACTIVE_KEY);
        const storedId = stored ? parseInt(stored, 10) : null;
        const match = list.find((b) => b.id === storedId);
        if (match) {
          setActiveId(match.id);
        } else {
          setActiveId(list[0].id);
          await AsyncStorage.setItem(ACTIVE_KEY, String(list[0].id));
        }
      } else {
        setActiveId(null);
      }
    } catch { /* network off etc */ }
  }, []);

  useEffect(() => {
    if (isAuthenticated) refreshBabies();
    else { setBabies([]); setActiveId(null); }
  }, [isAuthenticated, refreshBabies]);

  const setActiveBaby = useCallback(async (id) => {
    setActiveId(id);
    await AsyncStorage.setItem(ACTIVE_KEY, String(id));
  }, []);

  const addBaby = useCallback(async (data) => {
    const baby = await apiCreateBaby(data);
    await refreshBabies();
    return baby;
  }, [refreshBabies]);

  const editBaby = useCallback(async (id, data) => {
    const baby = await apiUpdateBaby(id, data);
    await refreshBabies();
    return baby;
  }, [refreshBabies]);

  const removeBaby = useCallback(async (id) => {
    await apiDeleteBaby(id);
    await refreshBabies();
  }, [refreshBabies]);

  const activeBaby = useMemo(
    () => babies.find((b) => b.id === activeId) || null,
    [babies, activeId],
  );

  const value = useMemo(() => ({
    babies,
    activeBaby,
    refreshBabies,
    setActiveBaby,
    addBaby,
    editBaby,
    removeBaby,
  }), [babies, activeBaby, refreshBabies, setActiveBaby, addBaby, editBaby, removeBaby]);

  return <BabyCtx.Provider value={value}>{children}</BabyCtx.Provider>;
}

export function useBaby() {
  return useContext(BabyCtx);
}
