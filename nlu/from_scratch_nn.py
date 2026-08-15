import numpy as np

np.random.seed(42)

X = np.array([
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
])

y = np.array([
    [0],
    [1],
    [1],
    [0],
])

input_dim = 2
hidden_dim = 4
output_dim = 1

W1 = np.random.randn(input_dim, hidden_dim) * 0.5
b1 = np.zeros((1, hidden_dim))
W2 = np.random.randn(hidden_dim, output_dim) * 0.5
b2 = np.zeros((1, output_dim))

def sigmoid(x):
    return 1 / (1 + np.exp(-x))

def sigmoid_derivative(activated):
    return activated * (1 - activated)

learning_rate = 0.5
epochs = 10000

for epoch in range(epochs):

    z1 = X @ W1 + b1
    a1 = sigmoid(z1)

    z2 = a1 @ W2 + b2
    a2 = sigmoid(z2)

    loss = np.mean((y - a2) ** 2)

    d_loss_a2 = -(y - a2)
    d_a2_z2 = sigmoid_derivative(a2)
    delta2 = d_loss_a2 * d_a2_z2

    d_W2 = a1.T @ delta2
    d_b2 = np.sum(delta2, axis=0, keepdims=True)

    d_a1 = delta2 @ W2.T
    d_z1 = d_a1 * sigmoid_derivative(a1)

    d_W1 = X.T @ d_z1
    d_b1 = np.sum(d_z1, axis=0, keepdims=True)

    W2 -= learning_rate * d_W2
    b2 -= learning_rate * d_b2
    W1 -= learning_rate * d_W1
    b1 -= learning_rate * d_b1

    if epoch % 1000 == 0:
        print(f"epoch {epoch}, loss {loss:.4f}")

print("\nfinal predictions:")
print(a2)