"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Keypair } from "@stellar/stellar-sdk";

interface CreateWalletFlowProps {
  onWalletCreated: (
    publicKey: string,
    secretKey: string,
    password: string
  ) => void;
  onBack: () => void;
}

type FlowStep = "password" | "recovery-phrase" | "confirm-phrase";

export function CreateWalletFlow({
  onWalletCreated,
  onBack,
}: CreateWalletFlowProps) {
  const [currentStep, setCurrentStep] = useState<FlowStep>("password");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [recoveryPhrase, setRecoveryPhrase] = useState<string[]>([]);
  const [showRecoveryPhrase, setShowRecoveryPhrase] = useState(false);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [shuffledWords, setShuffledWords] = useState<string[]>([]);
  const [confirmationError, setConfirmationError] = useState("");

  // Generate recovery phrase (simulated - in production you would use BIP39)
  const generateRecoveryPhrase = (): string[] => {
    const words = [
      "abandon",
      "ability",
      "able",
      "about",
      "above",
      "absent",
      "absorb",
      "abstract",
      "absurd",
      "abuse",
      "access",
      "accident",
      "account",
      "accuse",
      "achieve",
      "acid",
      "acoustic",
      "acquire",
      "across",
      "act",
      "action",
      "actor",
      "actress",
      "actual",
    ];

    const phrase = [];
    const usedWords = new Set<string>();

    while (phrase.length < 12) {
      const randomWord = words[Math.floor(Math.random() * words.length)];
      if (!usedWords.has(randomWord)) {
        phrase.push(randomWord);
        usedWords.add(randomWord);
      }
    }

    return phrase;
  };

  const validatePassword = (pwd: string): string[] => {
    const errors = [];
    if (pwd.length < 8)
      errors.push("Password must be at least 8 characters long");
    if (!/[A-Z]/.test(pwd))
      errors.push("Password must contain at least one uppercase letter");
    if (!/[a-z]/.test(pwd))
      errors.push("Password must contain at least one lowercase letter");
    if (!/\d/.test(pwd))
      errors.push("Password must contain at least one number");
    return errors;
  };

  const handlePasswordSubmit = () => {
    const errors = validatePassword(password);
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!agreedToTerms) {
      toast.error("You must agree to the Terms of Use");
      return;
    }

    // Generate recovery phrase and move to next step
    const phrase = generateRecoveryPhrase();
    setRecoveryPhrase(phrase);
    setCurrentStep("recovery-phrase");
  };

  const handleShowRecoveryPhrase = () => {
    setShowRecoveryPhrase(true);
  };

  const handleContinueToConfirm = () => {
    // Create shuffled version for confirmation
    const shuffled = [...recoveryPhrase].sort(() => Math.random() - 0.5);
    setShuffledWords(shuffled);
    setCurrentStep("confirm-phrase");
  };

  const handleWordSelect = (word: string) => {
    if (selectedWords.length < 12 && !selectedWords.includes(word)) {
      setSelectedWords([...selectedWords, word]);
      setConfirmationError("");
    }
  };

  const handleWordRemove = (index: number) => {
    const newSelected = selectedWords.filter((_, i) => i !== index);
    setSelectedWords(newSelected);
    setConfirmationError("");
  };

  const handleConfirmPhrase = () => {
    const isCorrect = selectedWords.every(
      (word, index) => word === recoveryPhrase[index]
    );

    if (!isCorrect) {
      setConfirmationError("The word order is incorrect. Please try again.");
      setSelectedWords([]);
      return;
    }

    // Generate Stellar keypair
    const keypair = Keypair.random();

    toast.success("Wallet created successfully!");
    onWalletCreated(keypair.publicKey(), keypair.secret(), password);
  };

  const copyToClipboard = async (text: string) => {
    try {
      // Check if clipboard API is available
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        toast.success("Recovery phrase copied to clipboard");
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand("copy");
          toast.success("Recovery phrase copied to clipboard");
        } catch {
          toast.error("Failed to copy to clipboard. Please copy manually.");
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch {
      toast.error("Failed to copy to clipboard. Please copy manually.");
    }
  };

  if (currentStep === "password") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Create a Password</CardTitle>
          <p className="text-sm text-muted-foreground">
            This will be used to unlock your wallet
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-orange-700">
                You are overwriting an existing account. You will permanently
                lose access to the account currently stored in Freighter.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) =>
                setAgreedToTerms(checked as boolean)
              }
            />
            <Label htmlFor="terms" className="text-sm">
              I have read and agree to Terms of Use
            </Label>
          </div>

          <Button onClick={handlePasswordSubmit} className="w-full">
            Confirm
          </Button>

          <Button variant="outline" onClick={onBack} className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (currentStep === "recovery-phrase") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Recovery Phrase</CardTitle>
          <p className="text-sm text-muted-foreground">
            Your recovery phrase is the key to your account and is the only way
            to recover it. Keep it safe.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <p className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>
                Your recovery phrase gives you full access to your wallet and
                funds
              </span>
            </p>
            <p className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              <span>
                If you forget your password, you can use the recovery phrase to
                access your wallet
              </span>
            </p>
            <p className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              <span>NEVER share your phrase with anyone</span>
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-700">
              No one from Stellar Foundation will ever ask for your recovery
              phrase
            </p>
          </div>

          {!showRecoveryPhrase ? (
            <Button onClick={handleShowRecoveryPhrase} className="w-full">
              Show recovery phrase
            </Button>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 p-4 bg-gray-50 rounded-lg">
                {recoveryPhrase.map((word, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 text-sm"
                  >
                    <span className="text-gray-900 font-medium w-4">
                      {index + 1}.
                    </span>
                    <span className="font-mono text-gray-800">{word}</span>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={() => copyToClipboard(recoveryPhrase.join(" "))}
                className="w-full"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy phrase
              </Button>

              <Button onClick={handleContinueToConfirm} className="w-full">
                Continue
              </Button>
            </>
          )}

          <Button
            variant="outline"
            onClick={() => setCurrentStep("password")}
            className="w-full"
          >
            Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (currentStep === "confirm-phrase") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Confirm Recovery Phrase</CardTitle>
          <p className="text-sm text-muted-foreground">
            Select the words in the correct order to confirm your recovery
            phrase
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Confirmed words */}
          <div className="min-h-[100px] p-3 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 12 }).map((_, index) => (
                <div
                  key={index}
                  className={`p-2 rounded border text-center text-sm ${
                    selectedWords[index]
                      ? "bg-blue-50 border-blue-200 text-blue-800"
                      : "bg-gray-50 border-gray-200 text-gray-400"
                  }`}
                >
                  <span className="text-xs text-gray-600 mr-1">
                    {index + 1}.
                  </span>
                  {selectedWords[index] || "---"}
                  {selectedWords[index] && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-4 w-4 p-0 text-red-500 hover:text-red-700"
                      onClick={() => handleWordRemove(index)}
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {confirmationError && (
            <div className="text-red-500 text-sm text-center">
              {confirmationError}
            </div>
          )}

          {/* Available words */}
          <div className="space-y-2">
            <Label>Select words in order:</Label>
            <div className="grid grid-cols-3 gap-2">
              {shuffledWords.map((word, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className={`text-xs ${
                    selectedWords.includes(word)
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-blue-50"
                  }`}
                  onClick={() => handleWordSelect(word)}
                  disabled={selectedWords.includes(word)}
                >
                  {word}
                </Button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleConfirmPhrase}
            className="w-full"
            disabled={selectedWords.length !== 12}
          >
            <Check className="h-4 w-4 mr-2" />
            Confirm and Create Wallet
          </Button>

          <Button
            variant="outline"
            onClick={() => setCurrentStep("recovery-phrase")}
            className="w-full"
          >
            Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}
