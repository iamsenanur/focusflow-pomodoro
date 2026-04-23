import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Vibration,
  View,
} from "react-native";

const DEFAULT_FOCUS_DURATION = 25 * 60;
const DEFAULT_BREAK_DURATION = 5 * 60;
const QUICK_TASKS = ["Study", "Workout", "Reading", "Coding"];
const { width } = Dimensions.get("window");

const CHIME_SOUND = require("../../assets/sounds/pomodoro_chime.wav");
const DANCING_CAT = require("../../assets/images/dancing-cat.png");

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function normalizeTaskKey(taskName: string) {
  return taskName.trim().toLocaleLowerCase("tr-TR");
}

type Mode = "focus" | "break";

type ConfettiPieceProps = {
  left: number;
  delay: number;
  symbol: string;
  visible: boolean;
};

type CompletedTaskMap = {
  [taskKey: string]: {
    label: string;
    count: number;
  };
};

function ConfettiPiece({ left, delay, symbol, visible }: ConfettiPieceProps) {
  const translateY = useRef(new Animated.Value(-40)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    translateY.setValue(-40);
    rotate.setValue(0);
    opacity.setValue(1);

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 420,
        duration: 1800,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: 1,
        duration: 1800,
        delay,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(delay + 1200),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [visible, delay, opacity, rotate, translateY]);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.Text
      style={[
        styles.confettiPiece,
        {
          left,
          opacity,
          transform: [{ translateY }, { rotate: spin }],
        },
      ]}
    >
      {symbol}
    </Animated.Text>
  );
}

export default function HomeScreen() {
  const [selectedTask, setSelectedTask] = useState<string>("Focus Session");
  const [customTask, setCustomTask] = useState<string>("Focus Session");
  const [focusMinutes, setFocusMinutes] = useState<string>("25");
  const [breakMinutes, setBreakMinutes] = useState<string>("5");
  const [timeLeft, setTimeLeft] = useState<number>(DEFAULT_FOCUS_DURATION);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentMode, setCurrentMode] = useState<Mode>("focus");
  const [completedSessions, setCompletedSessions] = useState<number>(0);
  const [completedTasks, setCompletedTasks] = useState<CompletedTaskMap>({});
  const [showCelebration, setShowCelebration] = useState<boolean>(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const player = useAudioPlayer(CHIME_SOUND);

  const catBounce = useRef(new Animated.Value(0)).current;
  const catRotate = useRef(new Animated.Value(0)).current;
  const catScale = useRef(new Animated.Value(0.8)).current;
  const catOpacity = useRef(new Animated.Value(0)).current;

  const confettiData = [
    { left: 20, delay: 0, symbol: "🎉" },
    { left: width * 0.18, delay: 120, symbol: "✨" },
    { left: width * 0.32, delay: 220, symbol: "🎊" },
    { left: width * 0.46, delay: 80, symbol: "⭐" },
    { left: width * 0.6, delay: 180, symbol: "🎉" },
    { left: width * 0.72, delay: 260, symbol: "✨" },
    { left: width * 0.84, delay: 140, symbol: "🎊" },
  ];

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
    });
  }, []);

  const getFocusDurationInSeconds = () => {
    const minutesValue = parseInt(focusMinutes, 10);
    return !isNaN(minutesValue) && minutesValue > 0
      ? minutesValue * 60
      : DEFAULT_FOCUS_DURATION;
  };

  const getBreakDurationInSeconds = () => {
    const minutesValue = parseInt(breakMinutes, 10);
    return !isNaN(minutesValue) && minutesValue > 0
      ? minutesValue * 60
      : DEFAULT_BREAK_DURATION;
  };

  const getCurrentModeDuration = (mode: Mode) => {
    return mode === "focus"
      ? getFocusDurationInSeconds()
      : getBreakDurationInSeconds();
  };

  const runCatAnimation = () => {
    catBounce.setValue(0);
    catRotate.setValue(0);
    catScale.setValue(0.8);
    catOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(catOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(catScale, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(catBounce, {
            toValue: -12,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.timing(catBounce, {
            toValue: 0,
            duration: 220,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 5 },
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(catRotate, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(catRotate, {
            toValue: -1,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(catRotate, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 5 },
      ),
    ]).start();

    setTimeout(() => {
      Animated.timing(catOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start();
    }, 2200);
  };

  const triggerCelebration = async () => {
    setShowCelebration(true);
    Vibration.vibrate(300);
    runCatAnimation();

    try {
      await player.seekTo(0);
      player.play();
    } catch (error) {
      console.log("Audio play error:", error);
    }

    setTimeout(() => {
      setShowCelebration(false);
    }, 2600);
  };

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }

            setIsRunning(false);

            if (currentMode === "focus") {
              setCompletedSessions((count) => count + 1);

              setCompletedTasks((prevTasks) => {
                const taskKey = normalizeTaskKey(selectedTask);
                const existingTask = prevTasks[taskKey];

                return {
                  ...prevTasks,
                  [taskKey]: {
                    label: existingTask?.label || selectedTask,
                    count: (existingTask?.count || 0) + 1,
                  },
                };
              });

              triggerCelebration();
              setCurrentMode("break");
              return getBreakDurationInSeconds();
            } else {
              Vibration.vibrate(200);
              setCurrentMode("focus");
              return getFocusDurationInSeconds();
            }
          }

          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, selectedTask, currentMode]);

  const handleStart = () => {
    if (timeLeft > 0) {
      Keyboard.dismiss();
      setIsRunning(true);
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(getCurrentModeDuration(currentMode));
  };

  const handleQuickTaskSelect = (task: string) => {
    setSelectedTask(task);
    setCustomTask(task);
    setIsRunning(false);
    setCurrentMode("focus");
    setTimeLeft(getFocusDurationInSeconds());
  };

  const handleApplyCustomSettings = () => {
    const trimmedTask = customTask.trim();
    const finalTask = trimmedTask.length > 0 ? trimmedTask : "Focus Session";

    Keyboard.dismiss();
    setSelectedTask(finalTask);
    setIsRunning(false);
    setCurrentMode("focus");
    setTimeLeft(getFocusDurationInSeconds());
  };

  const handleSkipMode = () => {
    setIsRunning(false);

    if (currentMode === "focus") {
      setCurrentMode("break");
      setTimeLeft(getBreakDurationInSeconds());
    } else {
      setCurrentMode("focus");
      setTimeLeft(getFocusDurationInSeconds());
    }
  };

  const completedTaskEntries = Object.entries(completedTasks).sort(
    (a, b) => b[1].count - a[1].count,
  );

  const catRotation = catRotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-10deg", "0deg", "10deg"],
  });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Daily Focus</Text>
              <Text style={styles.subtitle}>
                Stay focused, one session at a time
              </Text>
            </View>

            <View style={styles.timerCard}>
              <Text style={styles.label}>Current Mode</Text>
              <Text style={styles.modeText}>
                {currentMode === "focus" ? "Focus" : "Break"}
              </Text>

              <Text style={styles.label}>Current Task</Text>
              <Text style={styles.taskText}>
                {currentMode === "focus"
                  ? selectedTask
                  : `${selectedTask} Break`}
              </Text>

              <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>

              <View style={styles.buttonRow}>
                {!isRunning ? (
                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={handleStart}
                  >
                    <Text style={styles.buttonText}>
                      {currentMode === "focus" ? "Start Focus" : "Start Break"}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.pauseButton}
                    onPress={handlePause}
                  >
                    <Text style={styles.buttonText}>Pause</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={handleReset}
                >
                  <Text style={styles.buttonText}>Reset</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkipMode}
              >
                <Text style={styles.skipButtonText}>
                  {currentMode === "focus" ? "Skip to Break" : "Back to Focus"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.customSection}>
              <Text style={styles.sectionTitle}>Custom Focus Settings</Text>

              <TextInput
                style={styles.input}
                placeholder="Enter task name"
                placeholderTextColor="#D8B4D0"
                value={customTask}
                onChangeText={setCustomTask}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />

              <TextInput
                style={styles.input}
                placeholder="Enter focus duration in minutes"
                placeholderTextColor="#D8B4D0"
                value={focusMinutes}
                onChangeText={setFocusMinutes}
                keyboardType="numeric"
              />

              <TextInput
                style={styles.input}
                placeholder="Enter break duration in minutes"
                placeholderTextColor="#D8B4D0"
                value={breakMinutes}
                onChangeText={setBreakMinutes}
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={styles.doneButton}
                onPress={Keyboard.dismiss}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.applyButton}
                onPress={handleApplyCustomSettings}
              >
                <Text style={styles.buttonText}>Set Focus</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tasksSection}>
              <Text style={styles.sectionTitle}>Quick Select Task</Text>

              <View style={styles.taskList}>
                {QUICK_TASKS.map((task) => {
                  const isSelected = selectedTask === task;

                  return (
                    <TouchableOpacity
                      key={task}
                      style={[
                        styles.taskButton,
                        isSelected && styles.taskButtonSelected,
                      ]}
                      onPress={() => handleQuickTaskSelect(task)}
                    >
                      <Text
                        style={[
                          styles.taskButtonText,
                          isSelected && styles.taskButtonTextSelected,
                        ]}
                      >
                        {task}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.sessionCard}>
              <Text style={styles.sessionLabel}>Completed Task Summary</Text>

              {completedTaskEntries.length === 0 ? (
                <Text style={styles.emptySummaryText}>
                  No completed session yet
                </Text>
              ) : (
                completedTaskEntries.map(([taskKey, taskData]) => (
                  <View key={taskKey} style={styles.summaryRow}>
                    <Text style={styles.summaryTask}>{taskData.label}</Text>
                    <Text style={styles.summaryCount}>{taskData.count}</Text>
                  </View>
                ))
              )}

              <Text style={styles.sessionSubText}>
                Completed Sessions: {completedSessions}
              </Text>
            </View>
          </ScrollView>

          {showCelebration && (
            <View pointerEvents="none" style={styles.celebrationOverlay}>
              <Text style={styles.celebrationText}>Pomodoro Complete! 🎉</Text>

              <Animated.Image
                source={DANCING_CAT}
                style={[
                  styles.dancingCat,
                  {
                    opacity: catOpacity,
                    transform: [
                      { translateY: catBounce },
                      { rotate: catRotation },
                      { scale: catScale },
                    ],
                  },
                ]}
                resizeMode="contain"
              />

              {confettiData.map((item, index) => (
                <ConfettiPiece
                  key={index}
                  left={item.left}
                  delay={item.delay}
                  symbol={item.symbol}
                  visible={showCelebration}
                />
              ))}
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1F1129",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    marginTop: 8,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFF0F7",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#D8B4D0",
    textAlign: "center",
    marginTop: 6,
  },
  timerCard: {
    backgroundColor: "#2A1636",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: "#D8B4D0",
    marginBottom: 6,
  },
  modeText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFB6D9",
    marginBottom: 14,
    textAlign: "center",
  },
  taskText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFF0F7",
    marginBottom: 24,
    textAlign: "center",
  },
  timerText: {
    fontSize: 64,
    fontWeight: "800",
    color: "#FF77C8",
    letterSpacing: 2,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  startButton: {
    backgroundColor: "#FF4FA3",
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 14,
  },
  pauseButton: {
    backgroundColor: "#FF8DC7",
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 14,
  },
  resetButton: {
    backgroundColor: "#5A2B73",
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 14,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  skipButton: {
    marginTop: 14,
    backgroundColor: "#4A295C",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  skipButtonText: {
    color: "#FFF0F7",
    fontWeight: "600",
    fontSize: 14,
  },
  customSection: {
    backgroundColor: "#2A1636",
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
  },
  sectionTitle: {
    color: "#FFF0F7",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 14,
  },
  input: {
    backgroundColor: "#4A295C",
    color: "#FFF0F7",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  doneButton: {
    backgroundColor: "#7A3F98",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  doneButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  applyButton: {
    backgroundColor: "#FF5DB1",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 2,
  },
  tasksSection: {
    marginTop: 4,
  },
  taskList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  taskButton: {
    backgroundColor: "#2A1636",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
  },
  taskButtonSelected: {
    backgroundColor: "#FF77C8",
  },
  taskButtonText: {
    color: "#F6DCEE",
    fontWeight: "600",
  },
  taskButtonTextSelected: {
    color: "#2A1636",
  },
  sessionCard: {
    backgroundColor: "#2A1636",
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 18,
    alignItems: "stretch",
    marginTop: 20,
  },
  sessionLabel: {
    color: "#D8B4D0",
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
  },
  emptySummaryText: {
    color: "#FFF0F7",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#4A295C",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  summaryTask: {
    color: "#FFF0F7",
    fontSize: 16,
    fontWeight: "600",
  },
  summaryCount: {
    color: "#FF77C8",
    fontSize: 18,
    fontWeight: "700",
  },
  sessionSubText: {
    color: "#F6DCEE",
    fontSize: 14,
    marginTop: 10,
    textAlign: "center",
  },
  celebrationOverlay: {
    position: "absolute",
    top: 80,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
  },
  celebrationText: {
    color: "#FFF0F7",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 10,
    backgroundColor: "rgba(42, 22, 54, 0.88)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    overflow: "hidden",
    zIndex: 2,
  },
  dancingCat: {
    width: 500,
    height: 500,
    marginTop: 4,
    marginBottom: 10,
    zIndex: 2,
  },
  confettiPiece: {
    position: "absolute",
    top: 40,
    fontSize: 28,
  },
});
