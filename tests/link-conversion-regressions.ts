import test from 'node:test';
import assert from 'node:assert/strict';
import {planImageLinkConversion} from '../src/link-conversion';
const targets = ['a.png','assets/My image.png','测试.png','a(b).png','video.mp4'].map(path=>({path,extension:path.split('.').at(-1)!}));
const resolve = (path:string) => targets.find(file=>file.path===path || '../'+file.path===path) || null;
const replacements = (text:string) => planImageLinkConversion(text,resolve).filter(item=>item.replacement!==undefined);
test('conversion plans safe local inline images and preserves numeric dimensions',()=>{
    const input='Before ![](a.png) ![250](assets/My%20image.png) ![640x480](<测试.png>) after';
    const plan=replacements(input);
    assert.deepEqual(plan.map(item=>item.replacement),['![[a.png]]','![[assets/My image.png|250]]','![[测试.png|640x480]]']);
    for(const item of plan) assert.equal(input.slice(item.from,item.to),item.original);
    assert.equal(replacements('![](../a.png)')[0].replacement,'![[a.png]]');
});
test('conversion leaves ordinary alt text, titles, references and remote links unchanged',()=>{
    for(const input of ['![description](a.png)','![](a.png "title")','![250px](a.png)','![](https://example.com/a.png)','![](data:image/png;base64,AAAA)','![](//example.com/a.png)','![](a.png#part)','![](a.png?size=1)','![](missing.png)','![](video.mp4)','![](a%ZZ.png)','![](a\\(b\\).png)','![](a&amp;b.png)']){
        const plan=planImageLinkConversion(input,resolve);assert.ok(plan.every(item=>item.replacement===undefined),input);assert.ok(plan.every(item=>!!item.reason),input);
    }
    assert.equal(replacements('![ref][image]\n\n[image]: a.png').length,0);
});
test('conversion never touches code, frontmatter, comments, math or HTML contexts',()=>{
    for(const input of ['`![](a.png)`','```md\n![](a.png)\n```','    ![](a.png)','---\nimage: ![](a.png)\n---','---\nimage: ![](a.png)','%% ![](a.png) %%','%% ![](a.png)','$![](a.png)$','$$\n![](a.png)\n$$','<!-- ![](a.png) -->','<span>![](a.png)</span>','<div>\n![](a.png)\n</div>']) assert.equal(replacements(input).length,0,input);
    assert.equal(replacements('```\n![](a.png)\n```\n\n![](a.png)').length,1);
    assert.equal(replacements('%% hidden %%\n![](a.png)').length,0);
});
test('conversion avoids table delimiter changes and linked-image semantics',()=>{
    assert.equal(replacements('| image |\n| --- |\n| ![250](a.png) |').length,0);
    assert.equal(replacements('[![](a.png)](https://example.com)').length,0);
    assert.equal(replacements('\\![](a.png)').length,0);
});
test('conversion fails closed on unsafe wiki destinations and excessive input',()=>{
    for(const path of ['a#b.png','a|b.png','a[b].png','a^b.png','a?b.png','a\\b.png','a\nb.png']) assert.equal(planImageLinkConversion('![](a.png)',()=>({path,extension:'png'}))[0].replacement,undefined);
    assert.throws(()=>planImageLinkConversion('x'.repeat(2_000_001),resolve),/2 million/);
});

test('conversion bounds protected-region and image-preview work without quadratic slash scanning',()=>{
    assert.equal(replacements('\\'.repeat(100000)).length,0);
    assert.throws(()=>planImageLinkConversion(('`code` ').repeat(10001),resolve),/protected regions/);
    assert.throws(()=>planImageLinkConversion(('![](a.png) ').repeat(1001),resolve),/1000 image/);
});

test('delimiters inside code, frontmatter and HTML cannot expose real protected images',()=>{
    for(const input of ['```\n%%\n```\n\n%% ![](a.png) %%','`%%`\n\n%% ![](a.png) %%','---\nvalue: %%\n---\n\n%% ![](a.png) %%','<!-- $ -->\n\n$![](a.png)$','<div>\n\n![](a.png)\n\n</div>','```\n$\n```\n\n$![](a.png)$']) assert.equal(replacements(input).length,0,input);
});
test('raw and decoded identities must not disagree',()=>{
    const raw={path:'a%20b.png',extension:'png'},decoded={path:'a b.png',extension:'png'};
    const plan=planImageLinkConversion('![](a%20b.png)',link=>link===raw.path?raw:link===decoded.path?decoded:null);
    assert.equal(plan[0].replacement,undefined);assert.match(plan[0].reason!,/different files/);
});


test('literal delimiters in parsed links and definitions cannot expose later math or comments',()=>{
    for(const input of ['It costs $5.\n\n$![](a.png)$','![](money$.png)\n\n$![](a.png)$','[link](https://example.com/$)\n\n$![](a.png)$','![price $5](a.png)\n\n$![](a.png)$','[ref]: https://example.com/$\n\n$![](a.png)$','![](a%%.png)\n\n%% ![](a.png) %%']) {
        assert.equal(replacements(input).filter(item=>item.original==='![](a.png)').length,0,input);
    }
    assert.equal(replacements('![](a.png)\n\n$ math $\n![](a.png)').length,1);
});
