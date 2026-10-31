import React, { useState, useEffect, useCallback } from 'react';
import { Alert, Text, View, ScrollView, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { api } from '../lib/api';
import PrimaryButton from '../components/PrimaryButton';
import RatingStars from '../components/RatingStars';
import { theme } from '../theme';

export default function OrderDetailsScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Delivery state
  const [deliveryNote, setDeliveryNote] = useState('');
  const [deliveryLink, setDeliveryLink] = useState('');
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);

  // Review state
  const [existingReview, setExistingReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await api(`/api/orders/${orderId}`);
      setOrderData(res);

      // Check if user already reviewed
      if (res.order?.status === 'accepted') {
        const revRes = await api(`/api/reviews/order/${orderId}`).catch(() => ({}));
        if (revRes.reviewed) {
          setExistingReview(revRes.review);
        }
      }
    } catch (e) {
      Alert.alert('Could not load order', e.message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  async function handleOpenChat() {
    if (!orderData) return;
    const { order, isBuyer } = orderData;
    const recipient = isBuyer ? order.seller : order.buyer;
    if (!recipient) return;

    try {
      const res = await api('/api/chat/conversations', {
        method: 'POST',
        body: JSON.stringify({
          gigId: order.gig_id,
          recipientId: recipient.id
        })
      });
      navigation.navigate('Chat', {
        conversationId: res.conversation.id,
        recipientName: recipient.full_name || 'Campus Peer',
        gigTitle: order.gigs?.title
      });
    } catch (e) {
      Alert.alert('Could not start chat', e.message);
    }
  }

  async function handleFundEscrow() {
    setBusy(true);
    try {
      // 1. Create payment order
      const prep = await api('/api/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({ orderId })
      });

      // 2. Verify payment & lock funds into escrow
      const verification = await api('/api/payments/verify', {
        method: 'POST',
        body: JSON.stringify({
          orderId,
          paymentId: prep.paymentId || 'pay_demo_' + Date.now(),
          razorpayOrderId: prep.razorpayOrderId
        })
      });

      Alert.alert(
        'Escrow Funded! 🛡️',
        `₹${(orderData.order.agreed_price_paise / 100).toFixed(0)} is safely locked into Campus Escrow. The seller has been notified to start work.`
      );
      fetchOrder();
    } catch (e) {
      Alert.alert('Payment failed', e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmitDelivery() {
    if (!deliveryNote.trim()) {
      return Alert.alert('Delivery details', 'Please describe the work delivered or provide a link.');
    }
    setBusy(true);
    try {
      await api(`/api/orders/${orderId}/deliveries`, {
        method: 'POST',
        body: JSON.stringify({ note: deliveryNote.trim(), filePath: deliveryLink.trim() })
      });
      Alert.alert('Delivery Submitted! 📦', 'The buyer will review your work and release payment.');
      setShowDeliveryForm(false);
      setDeliveryNote('');
      setDeliveryLink('');
      fetchOrder();
    } catch (e) {
      Alert.alert('Delivery submission failed', e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleAcceptOrder() {
    Alert.alert(
      'Accept & Release Payment',
      'Are you satisfied with the delivered work? This will release the escrow funds to the seller.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept & Release',
          style: 'default',
          onPress: async () => {
            setBusy(true);
            try {
              await api(`/api/orders/${orderId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'accepted' })
              });
              Alert.alert('Order Completed! 🎉', 'Escrow funds have been released to the seller.');
              fetchOrder();
            } catch (e) {
              Alert.alert('Action failed', e.message);
            } finally {
              setBusy(false);
            }
          }
        }
      ]
    );
  }

  async function handleSubmitReview() {
    setSubmittingReview(true);
    try {
      const res = await api('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          orderId,
          rating: reviewRating,
          comment: reviewComment.trim()
        })
      });
      setExistingReview(res.review);
      Alert.alert('Review Submitted! ⭐', 'Thank you for building campus reputation and trust.');
    } catch (e) {
      Alert.alert('Review failed', e.message);
    } finally {
      setSubmittingReview(false);
    }
  }

  if (loading || !orderData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const { order, isBuyer, isSeller } = orderData;
  const gig = order.gigs || {};
  const partner = isBuyer ? order.seller : order.buyer;
  const partnerRole = isBuyer ? 'Seller' : 'Buyer';
  const partnerName = partner?.full_name || 'Campus Student';

  const statusColorMap = {
    awaiting_payment: '#D97706',
    funded: '#2563EB',
    in_progress: '#7C3AED',
    delivered: '#059669',
    accepted: '#16A34A',
    cancelled: '#DC2626',
    disputed: '#DC2626'
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 20 }}>
      {/* Header Info */}
      <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: theme.colors.border }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.muted }}>
            ORDER #{order.id.slice(0, 8).toUpperCase()}
          </Text>
          <View style={{ backgroundColor: (statusColorMap[order.status] || '#7C3AED') + '18', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: statusColorMap[order.status] || theme.colors.primary }}>
              {order.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={{ fontSize: 22, fontWeight: '900', color: theme.colors.text, marginTop: 10 }}>
          {gig.title || 'Campus Gig Order'}
        </Text>
        <Text style={{ fontSize: 24, fontWeight: '900', color: theme.colors.primaryDark, marginTop: 6 }}>
          ₹{(order.agreed_price_paise / 100).toFixed(0)}
        </Text>

        <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: 14 }} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 11, fontWeight: '700', color: theme.colors.muted }}>{partnerRole.toUpperCase()}</Text>
            <Text style={{ fontSize: 15, fontWeight: '800', color: theme.colors.text, marginTop: 2 }}>{partnerName}</Text>
          </View>

          {/* Quick Chat Button */}
          <Pressable
            onPress={handleOpenChat}
            style={{ backgroundColor: theme.colors.lavender, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 }}>
            <Text style={{ color: theme.colors.primaryDark, fontWeight: '800', fontSize: 13 }}>💬 Chat</Text>
          </Pressable>
        </View>
      </View>

      {/* Escrow Status Banner */}
      <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 18, marginTop: 16, borderWidth: 1, borderColor: theme.colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ fontSize: 20, marginRight: 8 }}>🛡️</Text>
          <Text style={{ fontSize: 16, fontWeight: '800', color: theme.colors.text }}>Campus Escrow Protection</Text>
        </View>
        <Text style={{ color: theme.colors.muted, fontSize: 13, lineHeight: 18, marginTop: 4 }}>
          {order.status === 'awaiting_payment'
            ? isBuyer
              ? 'Deposit the payment into SkillBridge Escrow before work begins to protect both parties.'
              : 'Waiting for the buyer to deposit payment into escrow.'
            : order.status === 'funded' || order.status === 'in_progress'
            ? 'Payment is safely locked in escrow. Funds will only be released after the buyer reviews and accepts delivery.'
            : order.status === 'delivered'
            ? 'Seller has delivered the work. Buyer can review deliverables and release funds.'
            : order.status === 'accepted'
            ? 'Order complete! Escrow funds have been disbursed to the seller.'
            : 'Order is under dispute or review.'}
        </Text>

        {/* Action: Fund Escrow if Buyer */}
        {order.status === 'awaiting_payment' && isBuyer && (
          <View style={{ marginTop: 14 }}>
            <PrimaryButton
              title={`Deposit ₹${(order.agreed_price_paise / 100).toFixed(0)} to Escrow`}
              onPress={handleFundEscrow}
              loading={busy}
            />
          </View>
        )}

        {/* Action: Release Escrow if Buyer and Delivered */}
        {order.status === 'delivered' && isBuyer && (
          <View style={{ marginTop: 14 }}>
            <PrimaryButton
              title="Accept Delivery & Release Funds"
              onPress={handleAcceptOrder}
              loading={busy}
            />
          </View>
        )}
      </View>

      {/* Review Section (After Order is Accepted) */}
      {order.status === 'accepted' && (
        <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 18, marginTop: 16, borderWidth: 1, borderColor: theme.colors.border }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: theme.colors.text }}>Peer Rating & Reputation</Text>
          {existingReview ? (
            <View style={{ backgroundColor: '#FAF9FE', borderRadius: 12, padding: 14, marginTop: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <RatingStars rating={existingReview.rating} size={18} />
                <Text style={{ fontSize: 13, fontWeight: '800', color: theme.colors.text, marginLeft: 8 }}>
                  {existingReview.rating}.0 / 5
                </Text>
              </View>
              {existingReview.comment ? (
                <Text style={{ fontSize: 13, color: theme.colors.text, fontStyle: 'italic' }}>
                  "{existingReview.comment}"
                </Text>
              ) : null}
            </View>
          ) : (
            <View style={{ marginTop: 10 }}>
              <Text style={{ fontSize: 13, color: theme.colors.muted, marginBottom: 8 }}>
                How was your experience working with {partnerName}?
              </Text>
              <RatingStars rating={reviewRating} size={30} interactive onRate={setReviewRating} />
              <TextInput
                value={reviewComment}
                onChangeText={setReviewComment}
                placeholder="Share feedback on communication, delivery quality, and speed..."
                placeholderTextColor={theme.colors.muted}
                multiline
                style={{
                  backgroundColor: '#FAF9FE',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  padding: 12,
                  minHeight: 70,
                  marginTop: 10,
                  fontSize: 14,
                  textAlignVertical: 'top'
                }}
              />
              <Pressable
                onPress={handleSubmitReview}
                disabled={submittingReview}
                style={{
                  backgroundColor: theme.colors.primary,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                  marginTop: 10
                }}>
                {submittingReview ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Submit Review</Text>
                )}
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* Delivery Section (For Seller) */}
      {isSeller && (order.status === 'funded' || order.status === 'in_progress') && (
        <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 18, marginTop: 16, borderWidth: 1, borderColor: theme.colors.border }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: theme.colors.text }}>Deliver Work</Text>
          <Text style={{ color: theme.colors.muted, fontSize: 13, marginTop: 4, marginBottom: 12 }}>
            When you finish the assignment or service, submit your work deliverables here.
          </Text>

          {!showDeliveryForm ? (
            <Pressable
              onPress={() => setShowDeliveryForm(true)}
              style={{ backgroundColor: theme.colors.primary, padding: 14, borderRadius: 14, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>+ Submit Delivery</Text>
            </Pressable>
          ) : (
            <View>
              <TextInput
                value={deliveryNote}
                onChangeText={setDeliveryNote}
                placeholder="Describe what has been delivered..."
                placeholderTextColor={theme.colors.muted}
                multiline
                style={{ backgroundColor: '#FAF9FE', borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, padding: 12, minHeight: 80, textAlignVertical: 'top', marginBottom: 10, fontSize: 14 }}
              />
              <TextInput
                value={deliveryLink}
                onChangeText={setDeliveryLink}
                placeholder="Google Drive, GitHub, Figma, or Dropbox link..."
                placeholderTextColor={theme.colors.muted}
                style={{ backgroundColor: '#FAF9FE', borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, padding: 12, marginBottom: 14, fontSize: 14 }}
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable
                  onPress={handleSubmitDelivery}
                  disabled={busy}
                  style={{ flex: 1, backgroundColor: theme.colors.primary, padding: 14, borderRadius: 12, alignItems: 'center' }}>
                  {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800' }}>Confirm Delivery</Text>}
                </Pressable>
                <Pressable
                  onPress={() => setShowDeliveryForm(false)}
                  style={{ paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' }}>
                  <Text style={{ color: theme.colors.muted, fontWeight: '700' }}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Deliveries History */}
      {order.deliveries && order.deliveries.length > 0 && (
        <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 18, marginTop: 16, borderWidth: 1, borderColor: theme.colors.border }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: theme.colors.text, marginBottom: 12 }}>
            Deliveries ({order.deliveries.length})
          </Text>
          {order.deliveries.map((del, idx) => (
            <View key={del.id || idx} style={{ backgroundColor: '#FAF9FE', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border }}>
              <Text style={{ fontSize: 12, color: theme.colors.muted, marginBottom: 4 }}>
                Delivered {new Date(del.created_at).toLocaleDateString()}
              </Text>
              <Text style={{ fontSize: 14, color: theme.colors.text, fontWeight: '600' }}>{del.note}</Text>
              {del.file_path ? (
                <Text style={{ fontSize: 13, color: theme.colors.primary, fontWeight: '700', marginTop: 6 }}>
                  🔗 {del.file_path}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
