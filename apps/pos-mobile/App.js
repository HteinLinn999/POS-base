import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Button,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera"; // Expo v57 Standard Hook ⭐
import axios from "axios";

const BACKEND_API_URL = "http://192.168.100.22:3001";

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  const [quantity, setQuantity] = useState("1");

  useEffect(() => {
    if (!permission || !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarcodeScanned = async ({ data }) => {
    const inputQty = parseInt(quantity, 10);

    if (isNaN(inputQty) || inputQty <= 0) {
      Alert.alert(
        "စာရင်းအမှား ⚠️",
        "ကျေးဇူးပြု၍ ပစ္စည်းအရေအတွက် အမှန်ကို အရင်ရိုက်ထည့်ပါ",
      );
      return;
    }
    setScanned(true);
    setLoading(true);

    try {
      const response = await axios.post(
        `${BACKEND_API_URL}/products/stock-in`,
        {
          barcode: data,
          quantity: inputQty,
        },
      );

      const updatedProduct = response.data;

      Alert.alert(
        "Stock ဖြည့်သွင်းမှု အောင်မြင်ပါသည် 🟢",
        `ကုန်ပစ္စည်း - ${updatedProduct.name}\nဘားကုဒ် - ${updatedProduct.barcode}\nယခုလက်ကျန်သစ် - ${updatedProduct.stockQuantity} ခု`,
        [
          {
            text: "အိုကေ (စကန်နာပြန်ဖွင့်မည်)",
            onPress: () => setScanned(false),
          },
        ],
      );
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        "ဆာဗာချိတ်ဆက်မှု ပြတ်တောက်နေပါသည်။ နောက်မှ ပြန်ကြိုးစားပါ";
      Alert.alert("ဂိုဒေါင်စာရင်းအမှား ❌", errorMsg, [
        { text: "ပြန်လည်ကြိုးစားမည်", onPress: () => setScanned(false) },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00d8ff" />
        <Text style={[styles.text, { marginTop: 20 }]}>
          ကင်မရာစနစ်အား အသက်သွင်းနေပါသည်...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          ဂိုဒေါင်စနစ် သုံးရန် ဖုန်းကင်မရာ ခွင့်ပြုချက် လိုအပ်ပါသည်
        </Text>
        <Button
          title="ကင်မရာ အသုံးပြုခွင့် ပေးမည်"
          onPress={requestPermission}
          color="#00d8ff"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>City Mart Warehouse</Text>
      <Text style={styles.subtitleText}>
        ဂိုဒေါင်ဝန်ထမ်းသုံး Barcode စကန်နာစနစ်
      </Text>

      {/* 📷 ကင်မရာ View Box */}
      <View style={styles.cameraWrapper}>
        <CameraView
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: [
              "qr",
              "ean13",
              "ean8",
              "code128",
              "upc_a",
              "upc_e",
              "datamatrix",
            ],
          }}
          style={styles.absoluteCameraView}
        />
        <View style={styles.overlayScannerBorder} />

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={[styles.text, { marginTop: 10 }]}>
              Stock သွင်းနေပါသည်...
            </Text>
          </View>
        )}
      </View>

      {/* 🛒 အသစ် — ဝန်ထမ်း လက်တွေ့ စကန်မဖတ်မီ အရေအတွက် စိတ်ကြိုက် ရိုက်ထည့်မည့် ဒစ်ဂျစ်တယ် အကွက် (Tailwind ဆန်ဆန် လှပသော UI) ⭐ */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>
          သွင်းမည့် ကုန်ပစ္စည်းအရေအတွက် (Qty) :
        </Text>
        <TextInput
          style={styles.numericInput}
          keyboardType="numeric" // ကီးဘုတ်တွင် ဂဏန်းသီးသန့်သာ ပေါ်လာစေရန် အတင်းအကျပ် ခိုင်းခြင်း
          value={quantity}
          onChangeText={(val) => setQuantity(val)}
          placeholder="ဥပမာ - ၁၀"
          placeholderTextColor="#9ca3af"
        />
      </View>

      {scanned && !loading && (
        <Button
          title={"စကန်နာအား ပြန်လည် အသက်သွင်းရန်"}
          onPress={() => setScanned(false)}
          color="#10b981"
        />
      )}

      <Text style={styles.footerText}>Expo v57 + Modern CameraView Engine</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#16171d",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  cameraWrapper: {
    width: 320,
    height: 320,
    borderWidth: 2,
    borderColor: "#00d8ff",
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    marginVertical: 35,
  },

  absoluteCameraView: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  overlayScannerBorder: {
    position: "absolute",
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: "#10b981",
    borderRadius: 8,
    alignSelf: "center",
    top: "20%",
    opacity: 0.6,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(22, 23, 29, 0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 5,
  },
  subtitleText: {
    fontSize: 14,
    color: "#9ca3af",
  },
  text: {
    fontSize: 16,
    color: "#f3f4f6",
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
    textAlign: "center",
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: "#2e303a",
    position: "absolute",
    bottom: 20,
  },
  //-----------

  inputContainer: {
    width: 320,
    marginBottom: 25,
  },
  inputLabel: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  numericInput: {
    backgroundColor: "#1f2028",
    color: "#ffffff",
    borderWidth: 1,
    borderColor: "#2e303a",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
});
