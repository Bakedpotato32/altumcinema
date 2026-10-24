import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Delete, ShieldAlert, Sparkles, Check } from 'lucide-react';
import { triggerHaptic } from '../services/haptics';

export const PinKeypadModal = ({
  isOpen,
  onClose,
  mode = 'unlock', // 'unlock' | 'setup'
  storedPin = null,
  onSuccess
}) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState('enter'); // 'enter' | 'confirm'
  const [errorShake, setErrorShake] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setConfirmPin('');
      setStep('enter');
      setErrorMessage('');
      triggerHaptic('light');
    }
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleDigitPress = (digit) => {
    triggerHaptic('selection');
    setErrorMessage('');

    if (mode === 'unlock') {
      const nextPin = pin + digit;
      if (nextPin.length <= 4) {
        setPin(nextPin);
        if (nextPin.length === 4) {
          validateUnlock(nextPin);
        }
      }
    } else {
      // Setup Mode
      if (step === 'enter') {
        const nextPin = pin + digit;
        if (nextPin.length <= 4) {
          setPin(nextPin);
          if (nextPin.length === 4) {
            setTimeout(() => {
              setStep('confirm');
              triggerHaptic('medium');
            }, 180);
          }
        }
      } else {
        const nextConfirm = confirmPin + digit;
        if (nextConfirm.length <= 4) {
          setConfirmPin(nextConfirm);
          if (nextConfirm.length === 4) {
            validateSetup(nextConfirm);
          }
        }
      }
    }
  };

  const handleDelete = () => {
    triggerHaptic('light');
    if (mode === 'unlock' || step === 'enter') {
      setPin((prev) => prev.slice(0, -1));
    } else {
      setConfirmPin((prev) => prev.slice(0, -1));
    }
  };

  const triggerError = (msg) => {
    triggerHaptic('error');
    setErrorMessage(msg);
    setErrorShake(true);
    setTimeout(() => {
      setErrorShake(false);
      if (mode === 'unlock') {
        setPin('');
      } else {
        setConfirmPin('');
      }
    }, 500);
  };

  const validateUnlock = (entered) => {
    if (entered === storedPin) {
      triggerHaptic('success');
      onSuccess(entered);
    } else {
      triggerError('Incorrect PIN. Try again.');
    }
  };

  const validateSetup = (enteredConfirm) => {
    if (enteredConfirm === pin) {
      triggerHaptic('success');
      onSuccess(enteredConfirm);
    } else {
      triggerError('PINs do not match. Re-enter.');
    }
  };

  const activeValue = mode === 'setup' && step === 'confirm' ? confirmPin : pin;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Bottom Drawer Card */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="relative z-10 w-full max-w-sm mx-auto bg-white/95 backdrop-blur-3xl border-t border-white/90 rounded-t-[36px] p-6 pb-10 shadow-2xl text-center"
        >
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-5" />

          {/* Header Icon */}
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-rose-500 to-orange-500 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-rose-500/25">
            <Lock size={24} />
          </div>

          <h3 className="text-base font-black text-slate-900 tracking-tight">
            {mode === 'setup'
              ? step === 'enter'
                ? 'Create Safe PIN'
                : 'Confirm 4-Digit PIN'
              : 'Unlock Private Safe'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'setup'
              ? step === 'enter'
                ? 'Choose a 4-digit secret code to lock private media.'
                : 'Please re-enter the code to confirm.'
              : 'Enter your 4-digit PIN to access locked clips.'}
          </p>

          {/* 4 Animated PIN Indicator Dots */}
          <motion.div
            animate={errorShake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-center space-x-4 my-6"
          >
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = activeValue.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    isFilled
                      ? 'bg-rose-500 scale-110 shadow-md shadow-rose-500/40'
                      : 'bg-slate-200'
                  }`}
                />
              );
            })}
          </motion.div>

          {/* Error Message */}
          {errorMessage && (
            <p className="text-xs font-bold text-rose-500 mb-4 flex items-center justify-center gap-1">
              <ShieldAlert size={13} /> {errorMessage}
            </p>
          )}

          {/* Numeric Keypad Grid */}
          <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto mb-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <motion.button
                key={num}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleDigitPress(num.toString())}
                className="h-14 rounded-2xl bg-slate-100/80 hover:bg-slate-200/80 text-lg font-black text-slate-800 shadow-sm border border-slate-200/60 flex items-center justify-center focus:outline-none"
              >
                {num}
              </motion.button>
            ))}

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="h-14 rounded-2xl text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center justify-center"
            >
              Cancel
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleDigitPress('0')}
              className="h-14 rounded-2xl bg-slate-100/80 hover:bg-slate-200/80 text-lg font-black text-slate-800 shadow-sm border border-slate-200/60 flex items-center justify-center focus:outline-none"
            >
              0
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleDelete}
              className="h-14 rounded-2xl bg-slate-100/80 hover:bg-slate-200/80 text-slate-600 shadow-sm border border-slate-200/60 flex items-center justify-center focus:outline-none"
            >
              <Delete size={20} />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
