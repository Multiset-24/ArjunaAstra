/** Interactive widgets (kind "widget"), keyed by catalog name. */
import type { ComponentType } from "react";
import Attention from "./Attention";
import Bits from "./Bits";
import Complexity from "./Complexity";
import ConsistentHashing from "./ConsistentHashing";
import Cosine from "./Cosine";
import GradientDescent from "./GradientDescent";
import Neuron from "./Neuron";
import Softmax from "./Softmax";

export const WIDGETS: Record<string, ComponentType<{ input: Record<string, unknown> }>> = {
  complexity: Complexity,
  bits: Bits,
  "consistent-hashing": ConsistentHashing,
  "gradient-descent": GradientDescent,
  softmax: Softmax,
  attention: Attention,
  cosine: Cosine,
  neuron: Neuron,
};
