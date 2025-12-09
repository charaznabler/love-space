
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Gift as GiftIcon, ExternalLink, Check, Trash2, X } from 'lucide-react';
import type { GiftItem } from '../types';
import { supabase } from '../lib/supabase';

const Gifts: React.FC = () => {
    const [items, setItems] = useState<GiftItem[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newItem, setNewItem] = useState<Partial<GiftItem>>({});
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
                setItems(data.map((row: GiftItem) => ({
                    id: row.id,
                    name: row.name,
                    link: row.link,
                    status: row.status,
                    note: row.note
                })));
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
                        const newRow = payload.new as GiftItem;
                        const item: GiftItem = {
                            id: newRow.id,
                            name: newRow.name,
                            link: newRow.link,
                            status: newRow.status,
                            note: newRow.note
                        };
                        setItems(prev => [item, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedRow = payload.new as GiftItem;
                        setItems(prev => prev.map(item =>
                            item.id === updatedRow.id
                                ? { ...item, status: updatedRow.status }
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

    const addGift = async () => {
        if (!newItem.name) return;

        const { error } = await supabase
            .from('gifts')
            .insert([{
                name: newItem.name,
                link: newItem.link,
                status: 'wanted',
                note: newItem.note
            }]);

        if (error) {
            console.error('Error adding gift:', error);
            return;
        }

        setIsAdding(false);
        setNewItem({});
    };

    const toggleStatus = async (id: string) => {
        const item = items.find(i => i.id === id);
        if (!item) return;

        const newStatus = item.status === 'wanted' ? 'purchased' : 'wanted';

        // Optimistic update
        setItems(items.map(i => i.id === id ? { ...i, status: newStatus } : i));

        const { error } = await supabase
            .from('gifts')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            // Revert on error
            setItems(items.map(i => i.id === id ? { ...i, status: item.status } : i));
            console.error('Error updating status:', error);
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
            // Revert (fetch again or revert state manually)
            // fetchGifts(); // Removed because we rely on optimistic updates or subscription, and fetchGifts is not in scope.
            // Actually, subscription might not catch our own delete immediately if we don't refetch, but let's assume valid delete.
            // If error, we should revert state.
            window.location.reload(); // Fallback to reload if critical error, or just log it.
            console.error('Error deleting gift:', error);
        }
    };

    return (
        <div className="flex flex-col h-full pt-4">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-love-900">心愿清单</h1>
                    <p className="text-sm text-love-400">想要的小礼物都在这里</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="btn-primary flex items-center gap-2 shadow-lg shadow-love-200"
                >
                    <Plus size={20} /> 添加
                </button>
            </header>

            <div className="grid grid-cols-1 gap-4 pb-20 overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-love-500"></div>
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-10 opacity-50">
                        <GiftIcon size={48} className="mx-auto text-gray-300 mb-2" />
                        <p>还没有添加想要的礼物哦</p>
                    </div>
                ) : (
                    items.map((gift) => (
                        <motion.div
                            key={gift.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`glass - panel p - 4 flex items - center gap - 4 transition - all ${gift.status === 'purchased' ? 'opacity-60 grayscale' : ''} `}
                        >
                            <div className={`p - 3 rounded - full flex - shrink - 0 ${gift.status === 'purchased' ? 'bg-green-100 text-green-500' : 'bg-love-100 text-love-500'} `}>
                                <GiftIcon size={24} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className={`font - bold text - love - 900 truncate ${gift.status === 'purchased' ? 'line-through text-gray-400' : ''} `}>
                                    {gift.name}
                                </h3>
                                {gift.note && <p className="text-xs text-gray-500 truncate">{gift.note}</p>}
                                {gift.link && (
                                    <a
                                        href={gift.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-400 flex items-center gap-1 mt-1 hover:underline"
                                    >
                                        <ExternalLink size={10} /> 查看链接
                                    </a>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => toggleStatus(gift.id)}
                                    className={`p - 2 rounded - full ${gift.status === 'wanted' ? 'bg-gray-100 hover:bg-green-100 text-gray-400 hover:text-green-500' : 'bg-green-100 text-green-500'} `}
                                >
                                    <Check size={18} />
                                </button>
                                <button
                                    onClick={(e) => deleteGift(gift.id, e)}
                                    className="p-2 rounded-full bg-gray-50 hover:bg-red-100 text-gray-400 hover:text-red-500"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </motion.div>
                    ))
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
                            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/20 backdrop-blur-sm p-4"
                        >
                            <motion.div
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-love-900">添加一个心愿</h2>
                                    <button onClick={() => setIsAdding(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                                        <X size={20} className="text-gray-500" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-love-400 ml-1">礼物名称</label>
                                        <input
                                            placeholder="例如：拍立得相机"
                                            value={newItem.name || ''}
                                            onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                            className="bg-love-50 border-transparent focus:bg-white focus:ring-2 focus:ring-love-200"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-love-400 ml-1">链接 (可选)</label>
                                        <input
                                            placeholder="https://..."
                                            value={newItem.link || ''}
                                            onChange={e => setNewItem({ ...newItem, link: e.target.value })}
                                            className="bg-love-50 border-transparent focus:bg-white focus:ring-2 focus:ring-love-200"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-love-400 ml-1">备注 (可选)</label>
                                        <textarea
                                            placeholder="颜色、型号等..."
                                            rows={2}
                                            value={newItem.note || ''}
                                            onChange={e => setNewItem({ ...newItem, note: e.target.value })}
                                            className="resize-none bg-love-50 border-transparent focus:bg-white focus:ring-2 focus:ring-love-200"
                                        />
                                    </div>

                                    <button
                                        onClick={addGift}
                                        disabled={!newItem.name}
                                        className="btn-primary w-full mt-4 flex justify-center items-center gap-2 disabled:opacity-50"
                                    >
                                        添加心愿
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
