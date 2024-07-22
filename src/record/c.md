# 备考刷题（Leecode）

## 冒泡排序

````c
#include<stdio.h>

int main(){
    int a[5] = {11, 22, 3, 14, 8};
    for (int i = 0; i < 5; i++)
    {
        for (int j = 0; j < 5 - i - 1; j++)
        {
            if (a[j] > a[j + 1])
            {
                int temp = a[j];
                a[j] = a[j + 1];
                a[j + 1] = temp;
            }
        }
    }
    // 循环打印 a   
    for (int i = 0; i < 5; i++)
    {
        printf("%d ", a[i]);
    }
}

````

## 两数之和

::: tip
需要使用 returnSize 确认数据大小，使用malloc 动态分配内存
:::

````c
#include <stdio.h>
#include <stdlib.h>

/**
* Note: The returned array must be malloced, assume caller calls free().
 */
int *twoSum(int *nums, int numsSize, int target, int *returnSize)
{
    *returnSize = 2;
    int* array = (int *)malloc(sizeof(int) * (*returnSize));
    for(int i = 0; i < numsSize - 1; i++) {
        for(int j = i + 1; j < numsSize; j++) {
            if(target == nums[i] + nums[j]) {
                array[0] = i;
                array[1] = j;
                return array;
            }
        }
    }
    return 0;
}

int main(){
    int nums[] = {2, 7, 11, 15};
    int numsSize = 4;
    int returnSize[] ={}; 
    // 循环打印 a   
    twoSum(nums, numsSize, 9, returnSize);
    return 0;
}
````

## 两数相加

::: tip
判断有没有进位，如果有的话，且 两个节点目前还不为空，则继续和 进的位数进行相加。
如果没有，则直接相加
:::

````c
#include <stdio.h>
#include <stdlib.h>

/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     struct ListNode *next;
 * };
 */

struct ListNode
{
    int val;
    struct ListNode *next;
};
struct ListNode *addTwoNumbers(struct ListNode *l1, struct ListNode *l2)
{
    struct ListNode dummy;
    struct ListNode *new = &dummy;
    dummy.next = NULL;
    int flag = 0;
    while (l1 || l2)
    {
        int val = flag + (l1 ? l1->val : 0) + (l2 ? l2->val : 0);
        flag = val / 10;
        struct ListNode *node = (struct ListNode *)malloc(sizeof(struct ListNode));
        node->val = val % 10;
        node->next = NULL;
        new->next = node;
        new = node;
        if (l1)
            l1 = l1->next;
        if (l2)
            l2 = l2->next;
    }
    if (flag > 0)
    {
        struct ListNode *node = (struct ListNode *)malloc(sizeof(struct ListNode));
        node->val = flag;
        node->next = NULL;
        new->next = node;
    }
    return dummy.next;
}
````