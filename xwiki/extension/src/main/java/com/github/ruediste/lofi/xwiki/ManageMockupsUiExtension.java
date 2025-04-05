package com.github.ruediste.lofi.xwiki;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Map;

import javax.inject.Inject;

import org.xwiki.bridge.DocumentAccessBridge;
import org.xwiki.component.annotation.Component;
import org.xwiki.model.reference.DocumentReference;
import org.xwiki.model.reference.EntityReference;
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
    private DocumentAccessBridge documentAccessBridge;

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
                "<li><a href=\"" + getMockupManagementUrl()
                        + "\" title=\"LoFi Mockups\" rel=\"nofollow\">LoFi Mockups</a></li>",
                Syntax.XHTML_5);
    }

    public String getMockupManagementUrl() {
        return getMockupManagementUrl(documentAccessBridge.getCurrentDocumentReference());
    }

    public String getMockupManagementUrl(DocumentReference document) {
        EntityReference ref = document;
        var segments = new ArrayList<String>();
        while (ref != null) {
            String type;
            switch (ref.getType()) {
                case WIKI:
                    type = "wikis";
                    break;
                case DOCUMENT:
                    type = "pages";
                    break;
                case SPACE:
                    type = "spaces";
                    break;
                default:
                    throw new RuntimeException("Unsupported type " + ref.getType());
            }
            segments.add(type + "/" + ref.getName());
            ref = ref.getParent();
        }
        Collections.reverse(segments);
        try {
            String version = new String(getClass().getClassLoader().getResourceAsStream("version.txt").readAllBytes(),
                    StandardCharsets.UTF_8);
            return "/webjars/wiki%3Axwiki/lo-fi-mockups-webjar/" + version + "/index.html#xwiki?page="
                    + URLEncoder.encode(String.join("/", segments), "UTF-8");
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}