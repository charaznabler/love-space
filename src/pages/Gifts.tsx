
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Gift as GiftIcon,
    ExternalLink,
    Check,
    Trash2,
    X,
    Shirt,
    ShoppingBag,
    Sparkles,
    Smartphone,
    Footprints,
    Grid
} from 'lucide-react';
import type { GiftItem, GiftCategory } from '../types';
import { supabase } from '../lib/supabase';

// Category Configuration
const CATEGORIES: { id: GiftCategory; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'clothes', label: '衣服', icon: <Shirt size={18} />, color: 'bg-rose-100 text-rose-500' },
    { id: 'bags', label: '包包', icon: <ShoppingBag size={18} />, color: 'bg-amber-100 text-amber-600' },
    { id: 'cosmetics', label: '化妆品', icon: <Sparkles size={18} />, color: 'bg-pink-100 text-pink-500' },
    { id: 'electronics', label: '电子设备', icon: <Smartphone size={18} />, color: 'bg-blue-100 text-blue-500' },
    { id: 'shoes', label: '鞋子', icon: <Footprints size={18} />, color: 'bg-orange-100 text-orange-500' },
    { id: 'others', label: '其他', icon: <Grid size={18} />, color: 'bg-gray-100 text-gray-500' },
];

const Gifts: React.FC = () => {
    const [items, setItems] = useState<GiftItem[]>([]);
    const [filteredItems, setFilteredItems] = useState<GiftItem[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<GiftCategory | 'all'>('all');
    const [isAdding, setIsAdding] = useState(false);
    const [newItem, setNewItem] = useState<Partial<GiftItem>>({ category: 'others' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGifts = async () => {
            const { data, error } = await supabase
                .from('gifts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching gifts:', error);
                return;
            }

            if (data) {
                const mappedData = data.map((row: any) => ({
                    id: row.id,
                    name: row.name,
                    link: row.link,
                    status: row.status,
                    note: row.note,
                    category: row.category || 'others' // Fallback for existing data
                }));
                setItems(mappedData);
            }
            setLoading(false);
        };

        fetchGifts();

        const channel = supabase
            .channel('gifts_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'gifts' },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newRow = payload.new as any;
                        const item: GiftItem = {
                            id: newRow.id,
                            name: newRow.name,
                            link: newRow.link,
                            status: newRow.status,
                            note: newRow.note,
                            category: newRow.category || 'others'
                        };
                        setItems(prev => [item, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedRow = payload.new as any;
                        setItems(prev => prev.map(item =>
                            item.id === updatedRow.id
                                ? { ...item, ...updatedRow, category: updatedRow.category || 'others' }
                                : item
                        ));
                    } else if (payload.eventType === 'DELETE') {
                        const deletedRow = payload.old as Pick<GiftItem, 'id'>;
                        setItems(prev => prev.filter(item => item.id !== deletedRow.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Effect for filtering
    useEffect(() => {
        if (selectedCategory === 'all') {
            setFilteredItems(items);
        } else {
            setFilteredItems(items.filter(item => (item.category || 'others') === selectedCategory));
        }
    }, [selectedCategory, items]);

    const addGift = async () => {
        if (!newItem.name) return;

        const { error } = await supabase
            .from('gifts')
            .insert([{
                name: newItem.name,
                link: newItem.link,
                status: 'wanted',
                note: newItem.note,
                category: newItem.category || 'others'
            }]);

        if (error) {
            console.error('Error adding gift:', error);
            // Optionally notify user
            return;
        }

        setIsAdding(false);
        setNewItem({ category: 'others' });
    };

    const toggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'wanted' ? 'purchased' : 'wanted';

        // Optimistic update
        setItems(items.map(i => i.id === id ? { ...i, status: newStatus as 'wanted' | 'purchased' } : i));

        const { error } = await supabase
            .from('gifts')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            // Revert on error
            console.error('Error updating status:', error);
            const originalItem = items.find(i => i.id === id);
            if (originalItem) {
                setItems(items.map(i => i.id === id ? originalItem : i));
            }
        }
    };

    const deleteGift = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('确定要删除这个心愿吗？')) return;

        // Optimistic update
        setItems(items.filter(i => i.id !== id));

        const { error } = await supabase
            .from('gifts')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting gift:', error);
            // Ideally revert here too, but risk is low
        }
    };

    const getCategoryIcon = (cat: string) => {
        const found = CATEGORIES.find(c => c.id === cat);
        return found ? found.icon : <GiftIcon size={18} />;
    };

    const getCategoryColor = (cat: string) => {
        const found = CATEGORIES.find(c => c.id === cat);
        return found ? found.color : 'bg-gray-100 text-gray-400';
    };

    return (
        <div className="flex flex-col h-full pt-4">
            <header className="mb-6 flex justify-between items-center px-1">
                <div>
                    <h1 className="text-2xl font-bold text-love-900 flex items-center gap-2">
                        心愿清单 <span className="text-sm font-normal text-love-400 bg-love-50 px-2 py-0.5 rounded-full">{items.length}</span>
                    </h1>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="btn-primary flex items-center gap-2 shadow-lg shadow-love-200/50"
                >
                    <Plus size={20} /> 添加
                </button>
            </header>

            {/* Category Filter */}
            <div className="flex gap-3 overflow-x-auto pb-4 mb-2 no-scrollbar px-1">
                <button
                    onClick={() => setSelectedCategory('all')}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === 'all'
                            ? 'bg-love-500 text-white shadow-md shadow-love-200'
                            : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
                        }`}
                >
                    全部
                </button>
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${selectedCategory === cat.id
                                ? 'bg-love-500 text-white shadow-md shadow-love-200'
                                : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
                            }`}
                    >
                        <span>{cat.label}</span>
                    </button>
                ))}
            </div>

            {/* Gift Grid */}
            <div className="flex-1 overflow-y-auto pb-20 px-1">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-love-500"></div>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center py-20 opacity-50 flex flex-col items-center">
                        <div className="bg-gray-100 p-6 rounded-full mb-4">
                            <GiftIcon size={48} className="text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium">还没有这个分类的心愿哦</p>
                        <p className="text-sm text-gray-400 mt-2">点击右上方添加一个吧</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {filteredItems.map((gift) => (
                            <motion.div
                                key={gift.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`relative group bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all ${gift.status === 'purchased' ? 'opacity-70' : ''
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-2xl flex-shrink-0 ${getCategoryColor(gift.category || 'others')}`}>
                                        {getCategoryIcon(gift.category || 'others')}
                                    </div>

                                    <div className="flex-1 min-w-0 pt-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className={`font-bold text-gray-800 text-lg truncate pr-2 ${gift.status === 'purchased' ? 'line-through text-gray-400' : ''}`}>
                                                {gift.name}
                                            </h3>
                                        </div>

                                        {gift.note && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{gift.note}</p>}

                                        <div className="flex items-center gap-3 mt-3">
                                            {gift.link && (
                                                <a
                                                    href={gift.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 bg-blue-50 px-2 py-1 rounded-md"
                                                >
                                                    <ExternalLink size={10} /> 链接
                                                </a>
                                            )}
                                            <span className="text-xs text-gray-300 ml-auto">
                                                {CATEGORIES.find(c => c.id === (gift.category || 'others'))?.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => toggleStatus(gift.id, gift.status)}
                                        className={`p-2 rounded-full transition-colors ${gift.status === 'wanted'
                                                ? 'bg-gray-100 hover:bg-green-100 text-gray-400 hover:text-green-600'
                                                : 'bg-green-100 text-green-600'
                                            }`}
                                        title={gift.status === 'wanted' ? "标记为已买" : "标记为想要"}
                                    >
                                        <Check size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => deleteGift(gift.id, e)}
                                        className="p-2 rounded-full bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                                        title="删除"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                {/* Mobile safe actions (always visible status) */}
                                <div className="sm:hidden absolute top-4 right-4">
                                    <button
                                        onClick={() => toggleStatus(gift.id, gift.status)}
                                        className={`p-1.5 rounded-full transition-colors ${gift.status === 'wanted'
                                                ? 'bg-gray-50 text-gray-300'
                                                : 'bg-green-100 text-green-600'
                                            }`}
                                    >
                                        <Check size={14} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {createPortal(
                <AnimatePresence>
                    {isAdding && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                            onClick={() => setIsAdding(false)}
                        >
                            <motion.div
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                onClick={e => e.stopPropagation()}
                                className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-gray-800">添加心愿礼物</h2>
                                    <button onClick={() => setIsAdding(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                                        <X size={20} className="text-gray-500" />
                                    </button>
                                </div>

                                <div className="space-y-5">
                                    {/* Category Selector */}
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 ml-1 mb-2 block">分类</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {CATEGORIES.map(cat => (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => setNewItem({ ...newItem, category: cat.id })}
                                                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${newItem.category === cat.id
                                                            ? 'border-love-500 bg-love-50 text-love-600 ring-1 ring-love-500'
                                                            : 'border-gray-200 hover:bg-gray-50 text-gray-500'
                                                        }`}
                                                >
                                                    <div className={newItem.category === cat.id ? 'text-love-500' : 'text-gray-400'}>
                                                        {cat.icon}
                                                    </div>
                                                    <span className="text-xs font-medium">{cat.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">礼物名称</label>
                                        <input
                                            placeholder="例如：Chanel 流浪包"
                                            value={newItem.name || ''}
                                            onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-love-200 outline-none transition-all"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">链接 (可选)</label>
                                            <input
                                                placeholder="https://..."
                                                value={newItem.link || ''}
                                                onChange={e => setNewItem({ ...newItem, link: e.target.value })}
                                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-love-200 outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">备注 (可选)</label>
                                            <input
                                                placeholder="小号 米白色..."
                                                value={newItem.note || ''}
                                                onChange={e => setNewItem({ ...newItem, note: e.target.value })}
                                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-love-200 outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={addGift}
                                        disabled={!newItem.name}
                                        className="btn-primary w-full py-3.5 text-base mt-2 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-love-200"
                                    >
                                        <Plus size={20} /> 添加到清单
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

export default Gifts;
