#include <climits>
#include "ArraySortingAlgorithms.h"

void Exchange(int& x, int& y)
{
	int aux = x;
	x = y;
	y = aux;
}

void SelectSort(int a[], const int n)
{
	for (int i = 0; i < n; i++)
	{
		int min = i;
		for (int j = i + 1; j < n; j++)
		{
			if (a[j] < a[min])
			{
				min = j;
			}
		}
		Exchange(a[min], a[i]);
	}
}

void InsertSort(int a[], const int n)
{
	for (int i = 1; i < n; i++)
	{
		int v = a[i];
		int j = i;
		while (j > 0)
		{
			if (a[j - 1] > v)
			{
				a[j] = a[j - 1];
				j -= 1;
			}
			else
			{
				break;
			}
		}
		a[j] = v;
	}
}

void BubbleSort4(int a[], const int n)
{
	int Right = n - 1;
	int LastExchangeIndex;
	do
	{
		LastExchangeIndex = 0;
		for (int i = 0; i < Right; i++)
		{
			if (a[i] > a[i + 1])
			{
				Exchange(a[i], a[i + 1]);
				LastExchangeIndex = i + 1;
			}
		}
		Right = LastExchangeIndex;
	} while (LastExchangeIndex > 0);
}

void ShakerSort(int a[], const int n)
{
	int ExchangeIndex = 0;
	int Left = 0;
	int Right = n - 1;
	do
	{
		for (int i = Left; i < Right; i++)
		{
			if (a[i] > a[i + 1])
			{
				Exchange(a[i], a[i + 1]);
				ExchangeIndex = i;
			}
		}
		Right = ExchangeIndex;
		for (int i = Right; i > Left; i--)
		{
			if (a[i - 1] > a[i])
			{
				Exchange(a[i - 1], a[i]);
				ExchangeIndex = i;
			}
		}
		Left = ExchangeIndex;
	} while (Left < Right);
}
