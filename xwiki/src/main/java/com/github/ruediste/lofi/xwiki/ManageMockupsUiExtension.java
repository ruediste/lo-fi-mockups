package com.github.ruediste.lofi.xwiki;

import java.util.Map;

import javax.inject.Inject;

import org.xwiki.component.annotation.Component;
import org.xwiki.model.reference.DocumentReference;
import org.xwiki.rendering.block.Block;
import org.xwiki.rendering.block.RawBlock;
import org.xwiki.rendering.syntax.Syntax;
import org.xwiki.uiextension.UIExtension;

import com.xpn.xwiki.XWiki;
import com.xpn.xwiki.user.api.XWikiRightService;

import groovy.lang.Singleton;

@Component
@Singleton
public class ManageMockupsUiExtension implements UIExtension {

    @Inject
    private LoFiService service;

    @Override
    public String getId() {
        return getClass().getName();
    }

    @Override
    public String getExtensionPointId() {
        return "org.xwiki.plaftorm.editactions";
    }

    @Override
    public Map<String, String> getParameters() {
        return Map.of("order", "120000");
    }

    public DocumentReference getAuthorReference() {
        return new DocumentReference("xwiki", XWiki.SYSTEM_SPACE, XWikiRightService.SUPERADMIN_USER);
    }

    @Override
    public Block execute() {
        return new RawBlock(
                "<li><a href=\"" + service.getMockupManagementUrl()
                        + "\" title=\"LoFi Mockups\" rel=\"nofollow\">LoFi Mockups</a></li>",
                Syntax.XHTML_5);
    }
}